
import React from 'react';
import { IdentifiedItem, ItemType } from '../types';

interface ResultCardProps {
  item: IdentifiedItem;
}

const ResultCard: React.FC<ResultCardProps> = ({ item }) => {
  const isLiving = item.type === ItemType.LIVING;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
          <span className={`inline-block px-3 py-1 mt-2 text-xs font-semibold rounded-full ${
            isLiving ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {item.type.toUpperCase()}
          </span>
        </div>
      </div>

      <p className="text-slate-600 mb-4 text-sm leading-relaxed">
        {item.description}
      </p>

      <div className="pt-4 border-t border-slate-50">
        {isLiving && item.scientificName ? (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Scientific Name</span>
            <span className="text-sm font-medium italic text-slate-700">
              {item.scientificName.genus} {item.scientificName.species}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Place of Origin</span>
            <span className="text-sm font-medium text-slate-700">
              {item.origin || 'Unknown'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultCard;
