"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { signOut } from "@/lib/auth/client";

interface DeleteAccountCardProps {
  userEmail: string;
}

interface DeleteApiResponse {
  success?: boolean;
  error?: string;
  code?: string;
  warnings?: Array<{ type: string; message: string }>;
}

/**
 * DeleteAccountCard - Danger zone component for permanent account deletion
 *
 * Features:
 * - Red "Danger Zone" styling
 * - Confirmation dialog requiring email input
 * - Loading state during deletion
 * - Automatic sign out and redirect on success
 * - Error handling with toast notifications
 */
export function DeleteAccountCard({ userEmail }: DeleteAccountCardProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if email matches (case-insensitive)
  const emailMatches = confirmation.toLowerCase() === userEmail.toLowerCase();

  const handleDelete = async () => {
    if (!emailMatches) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ confirmation }),
      });

      const data: DeleteApiResponse = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Failed to delete account";
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Show warnings if any
      if (data.warnings && data.warnings.length > 0) {
        data.warnings.forEach((warning) => {
          toast.warning(`Warning: ${warning.message}`);
        });
      }

      // Success - sign out and redirect
      toast.success("Your account has been deleted");

      // Close dialog before sign out
      setIsDialogOpen(false);

      // Sign out the user
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            // Redirect to homepage after sign out
            router.push("/");
            router.refresh();
          },
        },
      });
    } catch (err) {
      console.error("Account deletion error:", err);
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDialogClose = () => {
    if (isDeleting) return; // Prevent closing during deletion
    setIsDialogOpen(false);
    setConfirmation("");
    setError(null);
  };

  return (
    <>
      <Card className="shadow-depth-sm border-red-200 hover:shadow-depth-md transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-700">
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-4">
            <div>
              <h3 className="font-medium text-red-900">Delete Account</h3>
              <p className="text-sm text-red-700 mt-1">
                Permanently delete your account and all associated data. This action cannot be
                undone.
              </p>
            </div>
            <Button variant="destructive" onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Account
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-900">
                This action is permanent and cannot be undone.
              </p>
              <p className="text-sm text-red-700 mt-2">
                The following data will be permanently deleted:
              </p>
              <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                <li>Your profile information</li>
                <li>All uploaded resume files</li>
                <li>Your published portfolio page</li>
                <li>All account settings and preferences</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmation" className="text-sm font-medium text-slate-900">
                Type <span className="font-mono text-red-600">{userEmail}</span> to confirm
              </label>
              <Input
                id="confirmation"
                type="email"
                placeholder="Enter your email address"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                disabled={isDeleting}
                className={error ? "border-red-500" : ""}
                autoComplete="off"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleDialogClose}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!emailMatches || isDeleting}
                className="flex-1 gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Forever
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
