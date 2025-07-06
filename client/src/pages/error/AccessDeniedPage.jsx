import { Link } from 'react-router-dom';
import styles from './AccessDeniedPage.module.css';

export default function AccessDeniedPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Access Denied</h1>
        <p>You are not signed in or your room link is invalid.</p>
        <Link to="/" className={styles.linkButton}>
          Go to Home
        </Link>
      </div>
    </div>
  );
}
