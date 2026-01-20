#!/usr/bin/env python3
"""
Redis Database Operations Script
Usage: source ~/python-envs/claude-db/bin/activate && python db/codes/redis_ops.py
"""

import os
import sys
import redis

# Load config from environment variables
REDIS_HOST = os.environ.get('REDIS_HOST', 'r-bp17r86g9eu9urg5wepd.redis.rds.aliyuncs.com')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD', '')
REDIS_DB = int(os.environ.get('REDIS_DB', 0))


def get_client():
    """Get Redis client"""
    return redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        password=REDIS_PASSWORD if REDIS_PASSWORD else None,
        db=REDIS_DB,
        decode_responses=True
    )


def get_keys(pattern='*'):
    """Get all keys matching pattern"""
    client = get_client()
    return client.keys(pattern)


def get(key):
    """Get value by key"""
    client = get_client()
    return client.get(key)


def set_key(key, value, ex=None):
    """Set key with optional expiration (seconds)"""
    client = get_client()
    return client.set(key, value, ex=ex)


def delete(key):
    """Delete a key"""
    client = get_client()
    return client.delete(key)


def exists(key):
    """Check if key exists"""
    client = get_client()
    return client.exists(key)


def ttl(key):
    """Get TTL of a key"""
    client = get_client()
    return client.ttl(key)


def info(section='all'):
    """Get Redis info"""
    client = get_client()
    return client.info(section)


def scan(cursor=0, match='*', count=100):
    """Scan keys with cursor"""
    client = get_client()
    return client.scan(cursor=cursor, match=match, count=count)


def flush_pattern(pattern):
    """Delete all keys matching pattern"""
    client = get_client()
    keys = client.keys(pattern)
    if keys:
        return client.delete(*keys)
    return 0


def main():
    """Main function with menu"""
    if len(sys.argv) < 2:
        print("Redis Operations Script")
        print("=" * 50)
        print("\nUsage: python redis_ops.py <command> [args]")
        print("\nCommands:")
        print("  keys [pattern]      - List all keys (default: *)")
        print("  get <key>           - Get value by key")
        print("  set <key> <value> [ex] - Set key with optional TTL (seconds)")
        print("  del <key>           - Delete a key")
        print("  exists <key>        - Check if key exists")
        print("  ttl <key>           - Get TTL of a key")
        print("  info [section]      - Get Redis info (default: all)")
        print("  scan [pattern] [count] - Scan keys with cursor")
        print("  flush <pattern>     - Delete all keys matching pattern")
        print("  mamoji:token:*      - Show all token blacklist keys")
        print("  mamoji:login:*      - Show all login fail keys")
        print("  mamoji:cache:*      - Show all cache keys")
        print("\nExamples:")
        print("  python redis_ops.py keys")
        print("  python redis_ops.py keys 'mamoji:*'")
        print("  python redis_ops.py get mamoji:token:blacklist:xxx")
        print("  python redis_ops.py set test_key 'test_value' 300")
        print("  python redis_ops.py del test_key")
        print("  python redis_ops.py flush 'mamoji:login:*'")
        sys.exit(1)

    command = sys.argv[1]

    try:
        client = get_client()

        if command == 'keys':
            pattern = sys.argv[2] if len(sys.argv) > 2 else '*'
            k = get_keys(pattern)
            print(f"\nKeys matching '{pattern}':")
            print("-" * 60)
            for key in k[:100]:  # Limit to 100 for display
                ttl_val = ttl(key)
                ttl_str = f" (TTL: {ttl_val}s)" if ttl_val > 0 else " (no expiry)"
                print(f"  {key}{ttl_str}")
            if len(k) > 100:
                print(f"  ... and {len(k) - 100} more keys")

        elif command == 'get':
            if len(sys.argv) < 3:
                print("Usage: python redis_ops.py get <key>")
                sys.exit(1)
            key = sys.argv[2]
            value = get(key)
            print(f"\nKey: {key}")
            print("-" * 40)
            if value:
                print(f"Value: {value}")
                print(f"TTL: {ttl(key)}s")
            else:
                print("Value: (nil)")

        elif command == 'set':
            if len(sys.argv) < 4:
                print("Usage: python redis_ops.py set <key> <value> [ex]")
                sys.exit(1)
            key = sys.argv[2]
            value = sys.argv[3]
            ex = int(sys.argv[4]) if len(sys.argv) > 4 else None
            result = set_key(key, value, ex)
            print(f"\nKey: {key}")
            print(f"Value: {value}")
            print(f"TTL: {ex}s" if ex else "TTL: (none)")
            print(f"Result: {'OK' if result else 'FAILED'}")

        elif command == 'del':
            if len(sys.argv) < 3:
                print("Usage: python redis_ops.py del <key>")
                sys.exit(1)
            key = sys.argv[2]
            result = delete(key)
            print(f"\nDeleted key: {key}")
            print(f"Affected: {result}")

        elif command == 'exists':
            if len(sys.argv) < 3:
                print("Usage: python redis_ops.py exists <key>")
                sys.exit(1)
            key = sys.argv[2]
            result = exists(key)
            print(f"\nKey: {key}")
            print(f"Exists: {bool(result)}")

        elif command == 'ttl':
            if len(sys.argv) < 3:
                print("Usage: python redis_ops.py ttl <key>")
                sys.exit(1)
            key = sys.argv[2]
            result = ttl(key)
            print(f"\nKey: {key}")
            if result == -1:
                print("TTL: (no expiry)")
            elif result == -2:
                print("TTL: (key does not exist)")
            else:
                print(f"TTL: {result}s")

        elif command == 'info':
            section = sys.argv[2] if len(sys.argv) > 2 else 'all'
            data = info(section)
            print(f"\nRedis Info ({section}):")
            print("-" * 60)
            if isinstance(data, dict):
                for key, value in list(data.items())[:50]:
                    print(f"  {key}: {value}")
            else:
                print(data)

        elif command == 'scan':
            pattern = sys.argv[2] if len(sys.argv) > 2 else '*'
            count = int(sys.argv[3]) if len(sys.argv) > 3 else 100
            cursor = 0
            print(f"\nScanning keys matching '{pattern}':")
            print("-" * 60)
            while True:
                cursor, keys = scan(cursor, pattern, count)
                for key in keys:
                    print(f"  {key}")
                if cursor == 0:
                    break

        elif command == 'flush':
            if len(sys.argv) < 3:
                print("Usage: python redis_ops.py flush <pattern>")
                sys.exit(1)
            pattern = sys.argv[2]
            count = flush_pattern(pattern)
            print(f"\nFlushed {count} keys matching '{pattern}'")

        elif command.startswith('mamoji:'):
            # Handle special key patterns
            pattern = command
            k = get_keys(pattern)
            print(f"\nKeys matching '{pattern}':")
            print("-" * 60)
            for key in k:
                value = get(key)
                ttl_val = ttl(key)
                print(f"  Key: {key}")
                print(f"  Value: {value}")
                print(f"  TTL: {ttl_val}s" if ttl_val > 0 else "  TTL: (no expiry)")
                print("-" * 40)

        else:
            print(f"Unknown command: {command}")
            sys.exit(1)

    except Exception as e:
        print(f"Redis Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
