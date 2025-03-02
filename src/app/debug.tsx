export default function Debug() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Debug Page</h1>
      <p>If you can see this, your Next.js deployment is working!</p>
      <p>Current environment: {process.env.NODE_ENV}</p>
    </div>
  );
} 