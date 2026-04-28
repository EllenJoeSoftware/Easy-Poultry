import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Users, Gavel } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import moment from 'moment';

function CountdownTimer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = moment();
      const end = moment(endTime);
      const diff = end.diff(now);

      if (diff <= 0) {
        setTimeLeft('Ended');
        return;
      }

      const duration = moment.duration(diff);
      const days = Math.floor(duration.asDays());
      const hours = duration.hours();
      const minutes = duration.minutes();
      const seconds = duration.seconds();

      setIsUrgent(diff < 3600000); // Less than 1 hour

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className={`flex items-center gap-1 text-sm font-medium ${isUrgent ? 'text-red-600' : 'text-gray-600'}`}>
      <Clock className="w-4 h-4" />
      {timeLeft}
    </div>
  );
}

export default function AuctionCard({ auction }) {
  const primaryImage = auction.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400';
  
  const poultryLabels = {
    chickens: 'Chickens', ducks: 'Ducks', geese: 'Geese', turkeys: 'Turkeys',
    quail: 'Quail', guinea_fowl: 'Guinea Fowl', peafowl: 'Peafowl', pigeons: 'Pigeons', other: 'Other'
  };

  const currentBid = auction.current_bid || auction.starting_bid;
  const hasStarted = moment().isAfter(auction.start_time);
  const hasEnded = moment().isAfter(auction.end_time);

  return (
    <Link to={createPageUrl('AuctionDetail') + `?id=${auction.id}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={primaryImage}
            alt={auction.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-[#E07A5F] text-white border-0">
              <Gavel className="w-3 h-3 mr-1" />
              Auction
            </Badge>
            <Badge className="bg-white/95 text-gray-800 backdrop-blur-sm border-0">
              {poultryLabels[auction.poultry_type]}
            </Badge>
          </div>
          {!hasStarted && (
            <div className="absolute bottom-3 left-3 bg-blue-500 text-white text-xs px-2 py-1 rounded">
              Starts {moment(auction.start_time).fromNow()}
            </div>
          )}
          {hasEnded && (
            <div className="absolute bottom-3 left-3 bg-gray-800 text-white text-xs px-2 py-1 rounded">
              Auction Ended
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-[#E07A5F] transition-colors line-clamp-1">
            {auction.title}
          </h3>
          {auction.breed && (
            <p className="text-sm text-gray-600 mb-2">{auction.breed}</p>
          )}

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="w-4 h-4" />
              <span>{auction.city}, {auction.province}</span>
            </div>
            {auction.quantity > 1 && (
              <span className="text-sm text-gray-500">Qty: {auction.quantity}</span>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {auction.bid_count > 0 ? 'Current Bid' : 'Starting Bid'}
              </p>
              <span className="text-2xl font-bold text-[#E07A5F]">
                R{currentBid.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              {!hasEnded && hasStarted && <CountdownTimer endTime={auction.end_time} />}
              {auction.bid_count > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <Users className="w-3 h-3" />
                  {auction.bid_count} bids
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}