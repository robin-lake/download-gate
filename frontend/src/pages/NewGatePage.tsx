import { Link } from 'react-router-dom';
import './NewGatePage.scss';

export default function NewGatePage() {
  return (
    <div className="new-gate-page">
      <h1>Create a new download gate</h1>
      <p className="new-gate-placeholder">
        The gate builder will go here. For now, you can{' '}
        <Link to="/dashboard">view your gates</Link>.
      </p>
    </div>
  );
}
