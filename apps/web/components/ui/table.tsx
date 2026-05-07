import React from "react";
import { cn } from "@/lib/utils";

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

function Table({ className, ...props }: TableProps) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

function TableHeader({ className, ...props }: TableHeaderProps) {
  return (
    <thead
      className={cn("border-b bg-gray-50 [&_tr]:border-b", className)}
      {...props}
    />
  );
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

function TableBody({ className, ...props }: TableBodyProps) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  );
}

interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

function TableFooter({ className, ...props }: TableFooterProps) {
  return (
    <tfoot
      className={cn(
        "border-t bg-gray-50 font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        "border-b transition-colors hover:bg-gray-50 data-[state=selected]:bg-gray-100",
        className,
      )}
      {...props}
    />
  );
}

interface TableHeadProps extends React.HTMLAttributes<HTMLTableCellElement> {}

function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-gray-600 [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

interface TableCellProps extends React.HTMLAttributes<HTMLTableCellElement> {}

function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

function TableCaption({ className, ...props }: TableCaptionProps) {
  return (
    <caption
      className={cn("mt-4 text-sm text-gray-500", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
