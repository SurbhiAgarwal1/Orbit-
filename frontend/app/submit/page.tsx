'use client';

import React from 'react';
import { ComplaintForm } from '../../components/forms/ComplaintForm';

export default function SubmitPage() {
  return (
    <div
      style={{
        padding: '32px',
        height: '100%',
        backgroundColor: 'var(--background)',
        overflowY: 'auto'
      }}
    >
      <ComplaintForm />
    </div>
  );
}
