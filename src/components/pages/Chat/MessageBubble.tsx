import { motion } from "framer-motion";

interface RichContent {
  type: string;
  title?: string;
  business_name?: string;
  image_url?: string;
  price?: number;
}

interface Props {
  isMine: boolean;
  text: string;
  time: string;
  richContent?: RichContent | null;
}

export default function MessageBubble({ isMine, text, time, richContent }: Props) {
  const renderRichContent = (content: RichContent) => {
    switch (content.type) {
      case "service_card":
        return (
          <div className="flex items-start gap-3">
            {content.image_url && (
              <img
                src={content.image_url}
                alt={content.title ?? "Service"}
                className="w-32 h-32 object-cover rounded-lg border"
              />
            )}
            <div className="flex flex-col">
              <h4 className="font-semibold text-sm">{content.title}</h4>
              {content.business_name && (
                <p className="text-xs text-gray-600 mt-1">{content.business_name}</p>
              )}
              {content.price && (
                <p className="text-sm font-medium text-primary-600 mt-1">
                  {content.price.toLocaleString()} Furkredits
                </p>
              )}
            </div>
          </div>
        );
      default:
        return <p>{text}</p>;
    }
  };

  const isServiceCard = richContent?.type === "service_card";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`select-text cursor-default flex ${
        isMine ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`rounded-2xl px-4 py-2 shadow overflow-hidden
          ${isServiceCard ? "max-w-md bg-primary-50 text-gray-800" : "max-w-xs"} 
          ${isMine && !isServiceCard ? "bg-primary-500 text-white" : !isMine && !isServiceCard ? "bg-white text-gray-800" : ""}`}
      >
        {richContent ? renderRichContent(richContent) : <p>{text}</p>}
        <span
          className={`block mt-1 text-xs ${
            isMine && !isServiceCard ? "text-gray-200" : "text-gray-400"
          }`}
        >
          {time}
        </span>
      </div>
    </motion.div>
  );
}
