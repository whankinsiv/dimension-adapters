import { request, gql } from "graphql-request";
import { Adapter, FetchOptions, FetchResult } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";

const endpoint = "https://v2.api.liqwid.finance/graphql";

const query = gql`
  query Revenue($startDate: String, $endDate: String) {
    analytics {
      revenue(startDate: $startDate, endDate: $endDate) {
        current {
          dividendsFromRepaidInterestInUsd
          liquidationProfitInUsd
          loanOriginationFeesInUsd
          revenueFromRepaidInterestInUsd
          fromDate
          toDate
        }
      }
    }
  }
`;

const fetch = async (options: FetchOptions): Promise<FetchResult> => {
    const startDate = new Date(options.startTimestamp * 1000).toISOString();
    const endDate = new Date(options.endTimestamp * 1000).toISOString();

    const data = await request(endpoint, query, {
        startDate,
        endDate,
    });

    const revenue = data?.analytics?.revenue?.current;
    if (!revenue) return {};

    const dailyRevenue =
        Number(revenue.revenueFromRepaidInterestInUsd || 0) +
        Number(revenue.dividendsFromRepaidInterestInUsd || 0);


    const dailyFees =
        Number(revenue.liquidationProfitInUsd || 0) +
        Number(revenue.loanOriginationFeesInUsd || 0) +
        dailyRevenue;

    return {
        dailyFees,
        dailyRevenue,
    };
};

const adapter: Adapter = {
    version: 2,
    adapter: {
        [CHAIN.CARDANO]: {
            fetch,
            start: "2023-02-03",
        },
    },
    allowNegativeValue: true,
    methodology: {
        Fees: "Total fees paid by borrowers and liquidated positions, including interest repayments, loan origination fees, and liquidation penalties",
        Revenue: "Protocol revenue derived from repaid interest and dividends from interest",
    },
};

export default adapter;
