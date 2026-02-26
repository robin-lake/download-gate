import { Link } from 'react-router-dom';
import './GatesPage.scss';

export default function GatesPage() {
  return (
    <div className="gates-page">
      <h1>Your download gates</h1>
      <p className="gates-empty">
        You don’t have any gates yet.{' '}
        <Link to="/dashboard/new">Create your first gate</Link>.
      </p>
    </div>
  );
}
