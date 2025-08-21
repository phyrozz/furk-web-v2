import { useRef, useCallback } from "react";
import { UserProfileService } from "../../../services/profile/user-profile-service";
import { useLazyLoad } from "../../../hooks/useLazyLoad";
import PawLoading from "../../common/PawLoading";
import { DollarSign, ArrowDown, ArrowUp } from "lucide-react";
import { User } from "../../../models/user";
import DateUtils from "../../../utils/date-utils";

interface Transaction {
  id: string;
  user: User;
  booking_id: number;
  currency_type: string;
  amount: number;
  transaction_type: string;
  code: string;
  maya_reference_number: string | null;
  reference_number: string | null;
  created_at: string;
  created_by: string;
  modified_at: string;
  modified_by: string;
}

const formatAmount = (amount: number, currencyType: string) => {
  const absAmount = Math.abs(amount);
  if (currencyType === "furkredits") {
    // Remove decimal if it's .00
    return absAmount % 1 === 0 ? absAmount.toString() : absAmount.toFixed(2);
  }
  return Math.abs(Math.round(absAmount)).toString();
};

const TransactionHistory = () => {
  const service = new UserProfileService();

  const fetchTransactions = async (limit: number, offset: number) => {
    try {
      const res: any = await service.listTransactionHistory(limit, offset);
      return res.data || [];
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      return [];
    }
  };

  const {
    items: transactions,
    loadMore,
    loading,
    hasMore,
  } = useLazyLoad<Transaction>({
    fetchData: fetchTransactions,
    limit: 10,
    dependencies: [],
  });

  const observer = useRef<IntersectionObserver | null>(null);
  const lastTransactionRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, loadMore]
  );

  if (!transactions.length && loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <PawLoading />
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="text-center text-gray-400 py-12 text-lg">
        <DollarSign className="mx-auto mb-2 w-10 h-10 text-gray-300" />
        No transaction history found.
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto max-h-full pb-20 px-6 py-2">
      {transactions.map((transaction, idx) => {
        const isLast = idx === transactions.length - 1;
        const isCredit = transaction.amount > 0;
        const isFurkredits = transaction.currency_type === "furkredits";
        
        return (
          <div
            key={transaction.id}
            ref={isLast ? lastTransactionRef : undefined}
            className={`transition-shadow bg-white rounded-xl shadow-sm hover:shadow-md border p-5 ${isCredit ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className={`rounded-full p-2 mr-4 ${isCredit ? "bg-green-100" : "bg-red-100"}`}>
                  {isCredit ? (
                    <ArrowDown className={`h-6 w-6 ${isCredit ? "text-green-600" : "text-red-600"}`} />
                  ) : (
                    <ArrowUp className={`h-6 w-6 ${isCredit ? "text-green-600" : "text-red-600"}`} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">
                      {isCredit 
                        ? (isFurkredits ? "Top Up" : "Added")
                        : "Spent"}{" "}
                      <span className={isCredit ? "text-green-600" : "text-red-600"}>
                        {formatAmount(transaction.amount, transaction.currency_type)}
                      </span>{" "}
                      {isFurkredits ? "Furkredits" : "Furkoins"}
                    </h3>
                  </div>
                  {transaction.code && <div className="text-xs text-gray-400 mt-1">
                    Transaction Number: {transaction.code}
                  </div>}
                  {/* {transaction.booking_id && (
                    <div className="text-xs text-gray-400">
                      Booking ID: {transaction.booking_id}
                    </div>
                  )} */}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">{DateUtils.formatRelativeTime(transaction.created_at)}</div>
                {/* {transaction.maya_reference_number && (
                  <Tooltip
                    content={`Maya Reference Number: ${transaction.maya_reference_number}`}
                    position="left"
                  >
                    <div className="flex items-center justify-end mt-1 text-xs text-gray-400 cursor-help">
                      <Info size={14} className="mr-1" />
                      Maya Reference
                    </div>
                  </Tooltip>
                )}
                {transaction.reference_number && (
                  <Tooltip
                    content={`Reference Number: ${transaction.reference_number}`}
                    position="left"
                  >
                    <div className="flex items-center justify-end mt-1 text-xs text-gray-400 cursor-help">
                      <Info size={14} className="mr-1" />
                      Reference
                    </div>
                  </Tooltip>
                )} */}
              </div>
            </div>
          </div>
        );
      })}
      {loading && (
        <div className="flex justify-center items-center py-4">
          <PawLoading />
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;