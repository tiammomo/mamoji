# Claude Database Operations

This folder contains MySQL and Redis operation scripts for the Mamoji project.

## Setup

### 1. Install uv (if not already installed)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.local/bin/env
```

### 2. Create Python Environment

```bash
source $HOME/.local/bin/env
mkdir -p ~/python-envs
uv venv ~/python-envs/claude-db --python 3.12
```

### 3. Install Dependencies

```bash
source ~/python-envs/claude-db/bin/activate
uv pip install pymysql redis mysql-connector-python
```

## Configuration

Set environment variables for database connections:

```bash
# MySQL
export DATABASE_HOST=rm-bp14vg2ya3u8067d0ko.mysql.rds.aliyuncs.com
export DATABASE_PORT=3306
export DATABASE_USERNAME=mamoji
export DATABASE_PASSWORD=your_password
export DATABASE_NAME=mamoji

# Redis
export REDIS_HOST=r-bp17r86g9eu9urg5wepd.redis.rds.aliyuncs.com
export REDIS_PORT=6379
export REDIS_PASSWORD=your_password
export REDIS_DB=0
```

Or create a `.env` file in the project root:

```bash
# .env
DATABASE_HOST=rm-bp14vg2ya3u8067d0ko.mysql.rds.aliyuncs.com
DATABASE_PORT=3306
DATABASE_USERNAME=mamoji
DATABASE_PASSWORD=your_password
DATABASE_NAME=mamoji
REDIS_HOST=r-bp17r86g9eu9urg5wepd.redis.rds.aliyuncs.com
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
```

Then load it:
```bash
source .env
```

## Usage

### MySQL Operations

```bash
# Activate the environment
source ~/python-envs/claude-db/bin/activate

# Show all tables
python db/codes/mysql_ops.py tables

# Describe table structure
python db/codes/mysql_ops.py desc sys_user

# Select rows from table
python db/codes/mysql_ops.py select fin_transaction 50

# Count rows in table
python db/codes/mysql_ops.py count fin_transaction

# Execute custom SQL
python db/codes/mysql_ops.py exec "SELECT * FROM sys_user LIMIT 10"
```

### Redis Operations

```bash
# Activate the environment
source ~/python-envs/claude-db/bin/activate

# List all keys
python db/codes/redis_ops.py keys

# List keys matching pattern
python db/codes/redis_ops.py keys 'mamoji:*'

# Get key value
python db/codes/redis_ops.py get mamoji:token:blacklist:xxx

# Set key with TTL
python db/codes/redis_ops.py set test_key 'test_value' 300

# Delete key
python db/codes/redis_ops.py del test_key

# Flush keys matching pattern
python db/codes/redis_ops.py flush 'mamoji:login:*'

# Show token blacklist
python db/codes/redis_ops.py mamoji:token:*
```

## Scripts

| Script | Description |
|--------|-------------|
| `mysql_ops.py` | MySQL database operations |
| `redis_ops.py` | Redis database operations |
| `config.yaml` | Configuration template |
| `README.md` | This file |

## Quick Reference

```bash
# Activate environment
source ~/python-envs/claude-db/bin/activate

# MySQL
python db/codes/mysql_ops.py tables
python db/codes/mysql_ops.py desc <table>
python db/codes/mysql_ops.py select <table> [limit]

# Redis
python db/codes/redis_ops.py keys [pattern]
python db/codes/redis_ops.py get <key>
python db/codes/redis_ops.py set <key> <value> [ttl]
python db/codes/redis_ops.py del <key>
```
