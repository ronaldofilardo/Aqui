"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType | undefined>(
  undefined,
);

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          {children}
        </div>
      )}
    </DialogContext.Provider>
  );
}

function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within Dialog");
  }
  return context;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function DialogContent({ children, className, ...props }: DialogContentProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function DialogHeader({ className, children, ...props }: DialogHeaderProps) {
  const { onOpenChange } = useDialog();
  return (
    <div
      className={cn(
        "flex items-start justify-between px-6 py-4 border-b",
        className,
      )}
      {...props}
    >
      <div className="flex-1 pr-4">{children}</div>
      <button
        onClick={() => onOpenChange(false)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

function DialogTitle({ className, ...props }: DialogTitleProps) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <p className={cn("text-sm text-gray-500 mt-1", className)} {...props} />
  );
}

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      className={cn("flex justify-end gap-2 px-6 py-4 border-t", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
