import React, { useState } from 'react';
import { Hero } from './game/types';
import { HeroSelect } from './game/HeroSelect';
import { GameCanvas } from './game/GameCanvas';

type Screen = 'menu' | 'select' | 'game';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);

  const handleStartGame = () => {
    setScreen('select');
  };

  const handleHeroSelect = (hero: Hero) => {
    setSelectedHero(hero);
    setScreen('game');
  };

  const handleBack = () => {
    setSelectedHero(null);
    setScreen('menu');
  };

  if (screen === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          {/* Animated title */}
          <div className="mb-8 relative">
            <h1 className="text-7xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-pulse">
              ДОТА БАТЯ
            </h1>
            <p className="text-3xl text-yellow-300 mt-2 font-bold">⚔️ Смешная МОБА ⚔️</p>
            <div className="text-6xl mt-4 animate-bounce">
              👴👵🐱🧔🧒
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
            <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700">
              <div className="text-4xl mb-2">🎭</div>
              <h3 className="text-white font-bold">5 Героев</h3>
              <p className="text-gray-400 text-sm">Дед, Бабушка, Кот, Батя и Школьник</p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700">
              <div className="text-4xl mb-2">🛒</div>
              <h3 className="text-white font-bold">12 Предметов</h3>
              <p className="text-gray-400 text-sm">Тапок Судьбы, Борщ Силы и другие</p>
            </div>
            <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700">
              <div className="text-4xl mb-2">🗺️</div>
              <h3 className="text-white font-bold">3 Линии</h3>
              <p className="text-gray-400 text-sm">Top, Mid, Bot с башнями и крипами</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-4 items-center">
            <button
              onClick={handleStartGame}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-4 px-12 rounded-xl text-2xl hover:from-yellow-400 hover:to-orange-400 transition-all transform hover:scale-110 shadow-2xl shadow-orange-500/30"
            >
              🎮 ИГРАТЬ
            </button>
            <button
              onClick={() => {}}
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Версия 1.0 | Сделано с любовью и юмором
            </button>
          </div>

          {/* How to play */}
          <div className="mt-8 bg-gray-800/40 rounded-xl p-4 max-w-2xl mx-auto border border-gray-700">
            <h3 className="text-yellow-400 font-bold mb-2">📖 Как играть:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
              <div>🖱️ <b>ЛКМ</b> - двигаться к точке</div>
              <div>🖱️ <b>ПКМ</b> - атаковать/идти</div>
              <div>⌨️ <b>Q/W/E/R</b> - способности</div>
              <div>⌨️ <b>B</b> - открыть магазин</div>
              <div>⌨️ <b>S</b> - остановиться</div>
              <div>🎯 <b>Цель</b> - уничтожить вражескую базу!</div>
            </div>
          </div>

          {/* Enemy info */}
          <div className="mt-4 bg-red-900/20 rounded-xl p-4 max-w-2xl mx-auto border border-red-900/50">
            <h3 className="text-red-400 font-bold mb-2">⚠️ Враги:</h3>
            <div className="flex justify-center gap-6 text-sm text-gray-300">
              <div>👹 Босс Гопник</div>
              <div>🧛 Вампир Петрович</div>
              <div>🤡 Клоун из Интернета</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'select') {
    return <HeroSelect onSelect={handleHeroSelect} />;
  }

  if (screen === 'game' && selectedHero) {
    return <GameCanvas hero={selectedHero} onBack={handleBack} />;
  }

  return null;
}

export default App;
