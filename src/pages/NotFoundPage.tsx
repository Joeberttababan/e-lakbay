import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 py-24 sm:py-32 lg:px-8 text-white">
      <div className="text-center">
        <p className="text-sm font-semibold text-white/60">404</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
          Page not found
        </h1>
        <p className="mt-6 text-lg font-medium text-pretty text-white/70 sm:text-xl/8">
          Sorry, we could not find the page you are looking for.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-4">
          <Link
            to="/"
            className="rounded-full bg-hero-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
          >
            Go back home
          </Link>
          <a href="mailto:support@e-lakbay.com" className="text-sm font-semibold text-white/80 hover:text-white">
            Contact support <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </main>
  );
};

export default NotFoundPage;
