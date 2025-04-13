import React from "react";
import { formatDate } from "@/lib/utils";
import { 
  CheckCircle2, 
  Timer, 
  XCircle, 
  Lock, 
  User
} from "lucide-react";

interface ApprovalStep {
  id: number;
  userId: number;
  status: string;
  role: string;
  order: number;
  actionDate: string | null;
  comments: string | null;
  signature: string | null;
  user?: {
    fullName: string;
    role: string;
  };
}

interface ApprovalTimelineProps {
  steps: ApprovalStep[];
}

export function ApprovalTimeline({ steps }: ApprovalTimelineProps) {
  // Sort steps by order
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
  
  const getStepIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="text-green-500" />;
      case "pending":
        return <Timer className="text-amber-500" />;
      case "rejected":
        return <XCircle className="text-red-500" />;
      default:
        return <Lock className="text-gray-400" />;
    }
  };
  
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sortedSteps.map((step, stepIdx) => (
          <li key={step.id}>
            <div className="relative pb-8">
              {stepIdx !== sortedSteps.length - 1 ? (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-white">
                    {getStepIcon(step.status)}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-900">
                      {step.role === "initiator" ? (
                        <>
                          Request submitted by{" "}
                          <span className="font-medium">
                            {step.user?.fullName || "User"}
                          </span>
                        </>
                      ) : (
                        <>
                          {step.status === "approved" && "Approved by "}
                          {step.status === "rejected" && "Rejected by "}
                          {step.status === "pending" && "Waiting for approval from "}
                          <span className="font-medium">
                            {step.user?.fullName || "User"}{" "}
                          </span>
                          ({step.role})
                        </>
                      )}
                    </p>
                    {step.comments && (
                      <p className="mt-1 text-sm text-gray-500">
                        Comment: {step.comments}
                      </p>
                    )}
                    {step.signature && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Signature:</p>
                        <img 
                          src={step.signature} 
                          alt="Signature" 
                          className="h-12 border border-gray-200 rounded p-1 bg-white"
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                    {step.actionDate 
                      ? formatDate(step.actionDate)
                      : step.status === "pending" 
                        ? "Pending" 
                        : "Waiting"}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
