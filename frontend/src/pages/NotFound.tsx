import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-6xl" aria-hidden="true">🧭</p>
      <h1 className="mt-4 font-display text-3xl font-extrabold">Lost on the track?</h1>
      <p className="mt-2 text-slate-600">This page doesn't exist. Let's get you back to training.</p>
      <Link to="/" className="kivo-btn-primary mt-6 w-full">Back to KIVO</Link>
    </div>
  );
}
