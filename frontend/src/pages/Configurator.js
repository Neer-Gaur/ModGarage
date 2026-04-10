import { useNavigate } from 'react-router-dom';
import { Cube, ArrowLeft } from '@phosphor-icons/react';

export default function Configurator() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-mg-dark flex items-center justify-center px-6" data-testid="configurator-page">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 border border-white/10 flex items-center justify-center mx-auto mb-8">
          <Cube size={48} weight="thin" className="text-white/20" />
        </div>
        <p className="font-mono text-xs tracking-[0.3em] text-mg-red uppercase mb-4">3D Configurator</p>
        <h1 className="font-unbounded text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-4">
          Coming Soon
        </h1>
        <p className="text-white/40 font-manrope text-sm leading-relaxed mb-2">
          Our 3D car configurator is under development. You'll soon be able to visualize
          every modification on your car in real-time 3D.
        </p>
        <p className="text-white/20 font-mono text-xs tracking-wider uppercase mb-10">
          Please wait for sometime
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('/garage')}
            className="border border-white/20 text-white font-mono text-xs tracking-wider uppercase px-6 py-3 hover:bg-white hover:text-mg-dark transition-all flex items-center gap-2"
            data-testid="back-to-garage-btn"
          >
            <ArrowLeft size={14} /> Back to Garage
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            className="bg-mg-red text-white font-unbounded text-xs tracking-widest uppercase px-6 py-3 hover:bg-[#E62600] transition-colors"
            data-testid="browse-parts-btn"
          >
            Browse Parts
          </button>
        </div>
      </div>
    </div>
  );
}
