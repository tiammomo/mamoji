#!/usr/bin/env python3
"""
MySQL Database Operations Script
Usage: source ~/python-envs/claude-db/bin/activate && python db/codes/mysql_ops.py
"""

import os
import sys
import pymysql

# Load config from environment variables
DB_HOST = os.environ.get('DATABASE_HOST', 'rm-bp14vg2ya3u8067d0ko.mysql.rds.aliyuncs.com')
DB_PORT = int(os.environ.get('DATABASE_PORT', 3306))
DB_USER = os.environ.get('DATABASE_USERNAME', 'mamoji')
MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
DB_NAME = os.environ.get('DATABASE_NAME', 'mamoji')


def get_connection():
    """Get MySQL connection"""
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=MYSQL_PASSWORD,
        database=DB_NAME,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )


def execute_query(query, params=None):
    """Execute a query and return results"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            query_upper = query.strip().upper()
            if query_upper.startswith('SELECT') or query_upper.startswith('SHOW') or query_upper.startswith('DESCRIBE'):
                return cursor.fetchall()
            else:
                conn.commit()
                return cursor.rowcount
    finally:
        conn.close()


def show_tables():
    """Show all tables in database"""
    query = "SHOW TABLES"
    results = execute_query(query)
    tables = [list(row.values())[0] for row in results]
    return tables


def describe_table(table_name):
    """Describe table structure"""
    query = f"DESCRIBE `{table_name}`"
    return execute_query(query)


def select_table(table_name, limit=100):
    """Select all rows from a table"""
    query = f"SELECT * FROM `{table_name}` LIMIT %s"
    return execute_query(query, (limit,))


def count_table(table_name):
    """Count rows in a table"""
    query = f"SELECT COUNT(*) as cnt FROM `{table_name}`"
    results = execute_query(query)
    if results and isinstance(results, list) and len(results) > 0:
        return results[0]['cnt']
    return 0


def list_databases():
    """List all databases"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SHOW DATABASES")
            return [list(row.values())[0] for row in cursor.fetchall()]
    finally:
        conn.close()


def main():
    """Main function with menu"""
    if len(sys.argv) < 2:
        print("Usage: python mysql_ops.py <command> [args]")
        print("\nCommands:")
        print("  tables              - Show all tables")
        print("  desc <table>        - Describe table structure")
        print("  select <table> [n]  - Select rows from table (default: 100)")
        print("  count <table>       - Count rows in table")
        print("  databases           - List all databases")
        print("  exec <sql>          - Execute custom SQL query")
        print("\nExamples:")
        print("  python mysql_ops.py tables")
        print("  python mysql_ops.py desc sys_user")
        print("  python mysql_ops.py select fin_transaction 50")
        print("  python mysql_ops.py count fin_transaction")
        print("  python mysql_ops.py exec \"SELECT * FROM sys_user LIMIT 10\"")
        sys.exit(1)

    command = sys.argv[1]

    try:
        if command == 'tables':
            tables = show_tables()
            print(f"\nTables in database '{DB_NAME}':")
            print("-" * 40)
            for table in tables:
                count = count_table(table)
                print(f"  {table:<30} ({count} rows)")

        elif command == 'desc':
            if len(sys.argv) < 3:
                print("Usage: python mysql_ops.py desc <table>")
                sys.exit(1)
            table_name = sys.argv[2]
            results = describe_table(table_name)
            print(f"\nTable structure: {table_name}")
            print("-" * 80)
            print(f"{'Field':<30} {'Type':<20} {'Null':<5} {'Key':<5} {'Default':<15}")
            print("-" * 80)
            for row in results:
                print(f"{row['Field']:<30} {row['Type']:<20} {row['Null']:<5} {row['Key']:<5} {row['Default'] or 'NULL':<15}")

        elif command == 'select':
            limit = int(sys.argv[3]) if len(sys.argv) > 3 else 100
            if len(sys.argv) < 3:
                print("Usage: python mysql_ops.py select <table> [limit]")
                sys.exit(1)
            table_name = sys.argv[2]
            results = select_table(table_name, limit)
            print(f"\nRows from {table_name} (limit: {limit}):")
            print("-" * 60)
            if results:
                keys = results[0].keys()
                print("  ".join([f"{k:<20}" for k in keys]))
                print("-" * 60)
                for row in results:
                    print("  ".join([f"{str(v)[:20]:<20}" for v in row.values()]))
            else:
                print("  No rows found")

        elif command == 'count':
            if len(sys.argv) < 3:
                print("Usage: python mysql_ops.py count <table>")
                sys.exit(1)
            table_name = sys.argv[2]
            count = count_table(table_name)
            print(f"\nTable '{table_name}' has {count} rows")

        elif command == 'databases':
            databases = list_databases()
            print(f"\nDatabases:")
            print("-" * 40)
            for db in databases:
                print(f"  {db}")

        elif command == 'exec':
            if len(sys.argv) < 3:
                print("Usage: python mysql_ops.py exec <sql_query>")
                sys.exit(1)
            query = " ".join(sys.argv[2:])
            results = execute_query(query)
            print(f"\nQuery result:")
            print("-" * 60)
            if results:
                if isinstance(results, list) and results:
                    keys = results[0].keys()
                    print("  ".join([f"{k:<20}" for k in keys]))
                    print("-" * 60)
                    for row in results:
                        print("  ".join([f"{str(v)[:20]:<20}" for v in row.values()]))
                else:
                    print(f"  Affected rows: {results}")
            else:
                print("  No results")

        else:
            print(f"Unknown command: {command}")
            sys.exit(1)

    except pymysql.Error as e:
        print(f"MySQL Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
