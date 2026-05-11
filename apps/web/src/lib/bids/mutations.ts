'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { BidDto, PlaceBidRequest } from '@auction/shared';
import { apiFetch } from '../api/client';
import { handleError } from '../errors/handle-error';

export function usePlaceBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PlaceBidRequest) =>
      apiFetch<BidDto>('/bids', { method: 'POST', json: input }),
    onSuccess: (data, variables) => {
      // Invalidate the bid list so the new bid shows up immediately
      queryClient.invalidateQueries({
        queryKey: ['auctions', 'bids', variables.auctionId],
      });
      // The socket event `auction:bid-placed` will handle patching the current highest price
      // in the auction detail cache, so we don't strictly need to do it here, but we could
      // for immediate optimistic UI if we wanted. Relying on socket ensures consistent state.
      toast.success('Bid placed successfully!');
    },
    onError: (err) => {
      // handleError automatically toasts the error message from the API
      handleError(err);
    },
  });
}
