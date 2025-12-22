"use client";

import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    variant?: "default" | "destructive";
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    variant = "default"
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-900 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                    <DialogDescription className="text-muted">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="hover:bg-white/10"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        className={variant === "destructive" ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Hook to use confirm dialog
 * Usage:
 * const { confirm, ConfirmDialogComponent } = useConfirmDialog();
 * 
 * // In your component JSX:
 * {ConfirmDialogComponent}
 * 
 * // To show dialog:
 * const result = await confirm({
 *   title: "Are you sure?",
 *   description: "This action cannot be undone",
 *   variant: "destructive"
 * });
 * if (result) {
 *   // User confirmed
 * }
 */
export function useConfirmDialog() {
    const [dialogState, setDialogState] = useState<{
        open: boolean;
        title: string;
        description: string;
        confirmText?: string;
        cancelText?: string;
        variant?: "default" | "destructive";
        resolve?: (value: boolean) => void;
    }>({
        open: false,
        title: "",
        description: "",
    });

    const confirm = ({
        title,
        description,
        confirmText,
        cancelText,
        variant
    }: {
        title: string;
        description: string;
        confirmText?: string;
        cancelText?: string;
        variant?: "default" | "destructive";
    }): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialogState({
                open: true,
                title,
                description,
                confirmText,
                cancelText,
                variant,
                resolve,
            });
        });
    };

    const handleConfirm = () => {
        dialogState.resolve?.(true);
        setDialogState({ ...dialogState, open: false });
    };

    const handleCancel = (open: boolean) => {
        if (!open) {
            dialogState.resolve?.(false);
            setDialogState({ ...dialogState, open: false });
        }
    };

    const ConfirmDialogComponent = (
        <ConfirmDialog
            open={dialogState.open}
            onOpenChange={handleCancel}
            title={dialogState.title}
            description={dialogState.description}
            confirmText={dialogState.confirmText}
            cancelText={dialogState.cancelText}
            variant={dialogState.variant}
            onConfirm={handleConfirm}
        />
    );

    return { confirm, ConfirmDialogComponent };
}
