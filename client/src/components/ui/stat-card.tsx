import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  status?: string;
  icon: string;
  iconColor: string;
  changeText?: string;
  changeDirection?: "up" | "down" | "neutral";
}

export default function StatCard({
  title,
  value,
  status,
  icon,
  iconColor,
  changeText,
  changeDirection = "neutral",
}: StatCardProps) {
  const getIconColorClass = (color: string) => {
    switch (color) {
      case "primary":
        return "text-primary bg-primary";
      case "secondary":
        return "text-secondary bg-secondary";
      case "info":
        return "text-blue-500 bg-blue-500";
      case "warning":
        return "text-amber-500 bg-amber-500";
      case "error":
        return "text-red-500 bg-red-500";
      default:
        return "text-gray-500 bg-gray-500";
    }
  };
  
  const getChangeColorClass = (direction: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };
  
  const getChangeIcon = (direction: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up":
        return "arrow_upward";
      case "down":
        return "arrow_downward";
      default:
        return "remove";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-start">
        <div className="flex-1">
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-gray-800">{value}</h3>
          {changeText && (
            <p className={cn("text-sm mt-1 flex items-center", getChangeColorClass(changeDirection))}>
              <span className="material-icons text-sm mr-1">{getChangeIcon(changeDirection)}</span>
              {changeText}
            </p>
          )}
          {status && (
            <p className="text-sm mt-1 flex items-center text-amber-500">
              <span className="material-icons text-sm mr-1">priority_high</span>
              {status}
            </p>
          )}
        </div>
        <div className={cn(
          "w-10 h-10 rounded-full bg-opacity-10 flex items-center justify-center",
          getIconColorClass(iconColor)
        )}>
          <span className={cn("material-icons", getIconColorClass(iconColor).split(" ")[0])}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
