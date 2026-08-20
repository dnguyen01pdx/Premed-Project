import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * TEMPORARY diagnostic endpoint. Not linked from anywhere in the UI.
 * Returns only schema metadata (column names, migration tags) — no
 * credentials, no row data. Delete this file once the production schema
 * mismatch it's investigating is resolved.
 */
export async function GET() {
  try {
    const userColumns = await db.execute(
      sql`select column_name, data_type from information_schema.columns where table_name = 'users' order by ordinal_position`,
    );

    let migrations: unknown = null;
    try {
      const result = await db.execute(
        sql`select id, hash, created_at from drizzle.__drizzle_migrations order by created_at`,
      );
      migrations = result.rows;
    } catch (e) {
      migrations = { error: e instanceof Error ? e.message : String(e) };
    }

    let dbInfo: unknown = null;
    try {
      const result = await db.execute(
        sql`select current_database() as db, inet_server_addr() as server_addr, inet_server_port() as server_port`,
      );
      dbInfo = result.rows;
    } catch (e) {
      dbInfo = { error: e instanceof Error ? e.message : String(e) };
    }

    return NextResponse.json({
      userColumns: userColumns.rows,
      migrations,
      dbInfo,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
