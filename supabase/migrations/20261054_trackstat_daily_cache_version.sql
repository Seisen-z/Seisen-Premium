-- Refresh saved browser data after the daily-view migration and at each UTC midnight.
begin;
do $patch$
declare def text;
begin
 def:=pg_get_functiondef('public.trackstat_version(text[])'::regprocedure);
 if strpos(def,'daily-activity-v1:')>0 then return;end if;
 if substring(def from '(?i)\mreturn[[:space:]]+([^;]+);') is null then
  raise exception 'Trackstat version return expression missing';
 end if;
 execute regexp_replace(def,'(?i)\mreturn[[:space:]]+([^;]+);',
  $replacement$return md5('daily-activity-v1:' || (now() at time zone 'UTC')::date::text || ':' || (\1));$replacement$);
end $patch$;
notify pgrst,'reload schema';
commit;
