import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL || 'libsql://machine-operations-log-mop-log-khaled0.aws-ap-south-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODYwMzgwODgsImlkIjoiMDE5ZmQ4MmEtNTcwMS03MjFhLTg0ZTctOTE5YjE5MTNlZmI3Iiwia2lkIjoiaUVvUkhyUUFYMHg5blMzZzJJdkRqTlNHR0pjTS1Bcm1ZUHVFaXptMF_VMCIsInJpZCI6IjYzOWQ1ODNkLTExYWYtNDQ2Zi05MmFjLWQyYmU5ZTY5ZDYwMyJ9.akkoLSL7HP-45PfDG6aLifdVkfraKDBl0pqDG60uqopERk55zbua0tcBjGEufe-VkCSSSSdG1utkESJgA8NWBA';

const db = createClient({
  url: url,
  authToken: authToken,
});

export default db;