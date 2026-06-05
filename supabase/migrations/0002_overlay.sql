-- JustGift — overlay v2 alert settings.
-- Run in the Supabase SQL editor (idempotent).

alter table public.alert_settings
  add column if not exists position text not null default 'top-center'
    check (position in ('top-left', 'top-center', 'top-right', 'center')),
  add column if not exists sound_volume numeric not null default 0.8
    check (sound_volume between 0 and 1),
  add column if not exists tts_rate numeric not null default 1
    check (tts_rate between 0.5 and 2),
  add column if not exists tts_volume numeric not null default 1
    check (tts_volume between 0 and 1),
  add column if not exists big_threshold numeric not null default 500
    check (big_threshold >= 0),
  add column if not exists big_effect boolean not null default true;
