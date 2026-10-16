import LoginForm from './LoginForm';
import { savedTheme } from '../themeServer';

export default async function TrackstatLogin() {
  return <LoginForm initialTheme={await savedTheme()} />;
}
