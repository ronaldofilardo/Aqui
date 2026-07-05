-- Mark the missing migration as already applied
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
VALUES (
    gen_random_uuid(),
    '0',
    NOW(),
    '20260501000000_remove_asaas_integration',
    '',
    NULL,
    NOW(),
    1
) ON CONFLICT DO NOTHING;

-- Verify
SELECT migration_name, applied_steps_count, finished_at FROM "_prisma_migrations" ORDER BY finished_at DESC;