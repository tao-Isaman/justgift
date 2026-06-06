-- Just Gift — TTS read mode: 'all' reads name + amount + message,
-- 'message' reads only the donor's message.
alter table public.alert_settings
  add column if not exists tts_read text not null default 'all'
    check (tts_read in ('all', 'message'));
