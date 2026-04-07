'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog';
import { trpc } from '~/utils/trpc';

export function InviteLinkDialog({ trigger }: { trigger: React.ReactElement }) {
  const [copied, setCopied] = useState(false);
  const createMutation = trpc.friend.invite.create.useMutation();

  const link = createMutation.data
    ? `${window.location.origin}/invite/${createMutation.data.token}`
    : null;

  const handleCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog onOpenChange={(open) => {
      if (open && !createMutation.data) {
        createMutation.mutate();
      }
    }}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Invite a Friend</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Share this link with your friend. The link expires in 7 days and can only be used once.
        </p>
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-1 rounded-md border px-3 py-2 min-w-0">
            <p className="truncate text-sm text-muted-foreground">
              {link ?? 'Generating...'}
            </p>
          </div>
          <Button className="shrink-0" onClick={handleCopy} disabled={!link}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: You can also share the link via messaging apps
        </p>
      </DialogContent>
    </Dialog>
  );
}
