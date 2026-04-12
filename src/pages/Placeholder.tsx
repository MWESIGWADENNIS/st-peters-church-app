import React from 'react';
export default function Placeholder({ name }: { name: string }) {
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-primary mb-4">{name}</h1>
      <p className="text-gray-500 italic">This page is coming soon...</p>
    </div>
  );
}
