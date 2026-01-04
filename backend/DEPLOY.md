# Production Deployment & Database Management Guide

This document outlines the professional workflow for managing your database in production using SQLAlchemy and Alembic.

## 1. Initial Production Setup

On your production server, follow these steps ONE TIME:

1.  **Set Environment Variables**:
    Ensure your `.env` file or server environment has the following:
    ```bash
    DATABASE_URL=postgresql://user:password@localhost/dbname
    SECRET_KEY=your-super-secret-key
    JWT_SECRET_KEY=another-secret-key
    ```

2.  **Install Dependencies**:
    ```bash
    pip install Flask-Migrate psycopg2-binary  # or mysqlclient for MySQL
    ```

3.  **Run Initial Migration**:
    Instead of `db.create_all()`, run the following to bring the database schema up to date:
    ```bash
    flask db upgrade
    ```

## 2. Daily Development Workflow (Adding Changes)

When you need to add a new column or table:

1.  **Modify Models**: Update `models/all_models.py`.
2.  **Generate Migration (Local)**:
    ```bash
    flask db migrate -m "Added phone number to User"
    ```
3.  **Review Migration**: Check the generated file in `migrations/versions/`.
4.  **Test Locally**:
    ```bash
    flask db upgrade
    ```
5.  **Commit & Push**: Push the `migrations/` folder to GitHub.

## 3. Production Update (Deployment)

When you pull changes to the production server:

1.  **Pull Code**: `git pull origin main`
2.  **Apply Migrations**:
    ```bash
    flask db upgrade
    ```
3.  **Restart Server**: `systemctl restart niners-backend` (or your service manager).

## 4. Safety & Best Practices

- **Never Delete `migrations/` folder**: This folder tracks your DB history. If you lose it, you lose the ability to safely migrate production.
- **Backups**: Always run a DB backup before `flask db upgrade` in production:
    - Postgres: `pg_dump dbname > backup.sql`
    - MySQL: `mysqldump dbname > backup.sql`
- **Avoid Manual DB Edits**: Do not change the schema manually via SQL. Always use models + Alembic.
- **Rollback**: If an upgrade fails, you can roll back:
    ```bash
    flask db downgrade
    ```

## Common Issues & Solutions

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `Target database is not up to date` | Metadata and DB are out of sync | Run `flask db upgrade` |
| `Can't locate revision` | Migration files are missing | Ensure `migrations/versions` is in git |
| `Lock wait timeout` | Long-running query blocking migration | Kill blocking sessions before migrate |
