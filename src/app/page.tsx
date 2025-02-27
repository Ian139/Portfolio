import Portfolio from './components/Portfolio';
import ParticleBackground from './components/ParticleGlow';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <ParticleBackground />
      <main className="relative p-8 flex items-center justify-center min-h-screen">
        <Portfolio />
      </main>
    </div>
  );
}
