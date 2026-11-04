import React from 'react';
import { Hero } from './types';
import { heroes } from './heroes';

interface Props {
  onSelect: (hero: Hero) => void;
}

export const HeroSelect: React.FC<Props> = ({ onSelect }) => {
  const [selected, setSelected] = React.useState<Hero | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold text-yellow-400 mb-2 animate-pulse drop-shadow-lg">
          🎮 ДОТА БАТЯ 🎮
        </h1>
        <p className="text-2xl text-orange-300 font-bold">Смешная МОБА</p>
        <p className="text-gray-400 mt-2">Выбери своего героя и иди ломать базу врага!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 max-w-6xl">
        {heroes.map(hero => (
          <div
            key={hero.id}
            onClick={() => setSelected(hero)}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all duration-300 transform hover:scale-105 ${
              selected?.id === hero.id
                ? 'border-yellow-400 bg-yellow-400/20 shadow-lg shadow-yellow-400/30'
                : 'border-gray-600 bg-gray-800/80 hover:border-gray-400'
            }`}
          >
            <div className="text-5xl text-center mb-2">{hero.emoji}</div>
            <h3 className="text-white font-bold text-center text-lg">{hero.name}</h3>
            <p className="text-gray-400 text-center text-sm">{hero.role}</p>
            <div className="mt-2 text-xs text-gray-500 text-center">{hero.title}</div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="bg-gray-800/90 rounded-xl p-6 max-w-2xl border border-gray-600 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">{selected.emoji}</span>
            <div>
              <h2 className="text-2xl font-bold text-white">{selected.name}</h2>
              <p className="text-yellow-400">{selected.title}</p>
              <p className="text-gray-300 text-sm mt-1">{selected.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-red-900/50 rounded p-2 text-center">
              <div className="text-red-400 text-xs">❤️ HP</div>
              <div className="text-white font-bold">{selected.baseStats.maxHp}</div>
            </div>
            <div className="bg-blue-900/50 rounded p-2 text-center">
              <div className="text-blue-400 text-xs">💧 Мана</div>
              <div className="text-white font-bold">{selected.baseStats.maxMana}</div>
            </div>
            <div className="bg-orange-900/50 rounded p-2 text-center">
              <div className="text-orange-400 text-xs">⚔️ Атака</div>
              <div className="text-white font-bold">{selected.baseStats.attack}</div>
            </div>
            <div className="bg-green-900/50 rounded p-2 text-center">
              <div className="text-green-400 text-xs">🛡️ Защита</div>
              <div className="text-white font-bold">{selected.baseStats.defense}</div>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-yellow-400 font-bold mb-2">Способности:</h4>
            <div className="grid grid-cols-2 gap-2">
              {selected.abilities.map(ability => (
                <div key={ability.id} className="bg-gray-700/50 rounded p-2 flex items-center gap-2">
                  <span className="text-2xl">{ability.emoji}</span>
                  <div>
                    <div className="text-white text-sm font-bold">{ability.name}</div>
                    <div className="text-gray-400 text-xs">{ability.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onSelect(selected)}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-3 px-6 rounded-lg text-xl hover:from-yellow-400 hover:to-orange-400 transition-all transform hover:scale-105 shadow-lg"
          >
            ⚔️ В БОЙ! ⚔️
          </button>
        </div>
      )}

      <div className="text-gray-500 text-sm text-center mt-4">
        <p>🖱️ ЛКМ - двигаться | Пробел - атака | Q/W/E/R - способности | B - магазин</p>
      </div>
    </div>
  );
};
