
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "טוען את האפליקציה..." }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen flex flex-col bg-geoalert-gray">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-geoalert-turquoise mx-auto" />
          <p className="mt-4 text-lg text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
}
