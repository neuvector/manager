export function getCallbackUri(server: string): string {
  const protocol = location.protocol;
  const host = location.host;
  return `${protocol}//${host}/${server}`;
}

export function getAvatar(
  emailHash: string,
  username: string,
  color: string
): string {
  return (
    'https://secure.gravatar.com/avatar/' +
    emailHash +
    '?s=80&d=https%3A%2F%2Fui-avatars.com%2Fapi%2F/' +
    username +
    '/80/' +
    color +
    '/fff'
  );
}

export function getConvertHours(HOURS: string, DAYS: string) {
  return (value: number) => {
    if (!value) return '';
    let d = Math.floor(value / 24);
    let h = Math.round(value % 24);

    let hours = h === 0 ? '' : `${h}${HOURS}`;
    if (h === 1) hours = hours.replace('s', '');
    let days = d === 0 ? '' : `${d}${DAYS}`;
    if (d === 1) days = days.replace('s', '');
    if (!d) return `${hours}`;
    return h > 0 ? `${days}, ${hours}` : `${days}`;
  };
}
