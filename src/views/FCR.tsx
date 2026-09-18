// 3. REAL FEED STOCK & RUNWAY
  // IMPORTANT:
  // - Purchase/Received = stock only
  // - DailyActualRecord.actualFeedUsedKg = actual consumed feed
  // - Expected/standard feed NEVER enters stock or FCR
  // - Medicine/other records have ZERO effect
  // - Runway is based only on real recent feed-use records
  // - No biological projection / age simulation

  const feedStockSummary = useMemo(() => {
    if (!currentBatch || !fcrResult) return null;

    const bagWeight = Number(currentBatch.bagWeightKg || 50);

    // ------------------------------------------------------------
    // A. REAL PURCHASED / RECEIVED STOCK
    // ------------------------------------------------------------
    const purchasedBags = feedPurchases.reduce((sum, record) => {
      // Strict batch isolation
      if (record.batchId !== currentBatch.id) return sum;

      // Only stock-in / purchase type records
      if (record.recordType === 'actual_consumed') return sum;

      const bags = Number(record.quantityBags || 0);
      return sum + (Number.isFinite(bags) && bags > 0 ? bags : 0);
    }, 0);

    const totalCostSpent = feedPurchases.reduce((sum, record) => {
      if (record.batchId !== currentBatch.id) return sum;
      if (record.recordType === 'actual_consumed') return sum;

      const cost = Number(record.cost || 0);
      return sum + (Number.isFinite(cost) && cost > 0 ? cost : 0);
    }, 0);

    // Optional legacy batch-specific stock fallback
    // Never accepts unscoped stock.
    const localStockIn = localStorage.getItem(
      `fcr_stock_in_${currentBatch.id}`
    );

    const legacyStockBags =
      localStockIn && Number(localStockIn) > 0
        ? Number(localStockIn)
        : 0;

    const totalPurchasedBags = Math.max(
      purchasedBags,
      legacyStockBags
    );

    const totalPurchasedKg =
      totalPurchasedBags * bagWeight;

    // ------------------------------------------------------------
    // B. REAL ACTUAL FEED USED
    // ONLY DailyActualRecord.actualFeedUsedKg
    // ------------------------------------------------------------
    const actualFeedRecords = dailyRecords
      .filter(record =>
        record.batchId === currentBatch.id &&
        Number(record.actualFeedUsedKg || 0) > 0
      )
      .sort((a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
      );

    const totalUsedKg = actualFeedRecords.reduce(
      (sum, record) => {
        const kg = Number(record.actualFeedUsedKg || 0);
        return sum + (Number.isFinite(kg) && kg > 0 ? kg : 0);
      },
      0
    );

    // ------------------------------------------------------------
    // C. REMAINING REAL STOCK
    // ------------------------------------------------------------
    const remainingKg = Math.max(
      0,
      totalPurchasedKg - totalUsedKg
    );

    const remainingBags =
      bagWeight > 0
        ? Number((remainingKg / bagWeight).toFixed(1))
        : 0;

    // ------------------------------------------------------------
    // D. REAL DAILY CONSUMPTION
    //
    // Use only actual feed records.
    // Do NOT use expected feed.
    // Do NOT simulate future biological growth.
    //
    // Recent 7 actual feed-use records are preferred.
    // ------------------------------------------------------------
    const recentFeedRecords = actualFeedRecords.slice(-7);

    const recentTotalFeedKg = recentFeedRecords.reduce(
      (sum, record) => {
        const kg = Number(record.actualFeedUsedKg || 0);
        return sum + (Number.isFinite(kg) && kg > 0 ? kg : 0);
      },
      0
    );

    const averageDailyFeedKg =
      recentFeedRecords.length >= 3
        ? recentTotalFeedKg / recentFeedRecords.length
        : 0;

    // ------------------------------------------------------------
    // E. REAL RUNWAY
    //
    // Minimum 3 actual feed-use records required.
    // This prevents fake values like 460 days.
    // ------------------------------------------------------------
    let daysRunway: number | null = null;
    let runwayReady = false;

    if (
      remainingKg > 0 &&
      averageDailyFeedKg > 0 &&
      recentFeedRecords.length >= 3
    ) {
      daysRunway = Math.max(
        0,
        Math.floor(remainingKg / averageDailyFeedKg)
      );
      runwayReady = true;
    }

    // ------------------------------------------------------------
    // F. SIMPLE FEED ENTRY SANITY CHECK
    //
    // Detect obvious abnormal changes compared with recent
    // real usage. This does NOT alter saved data.
    // ------------------------------------------------------------
    let feedWarning = false;
    let feedWarningMessageBn = '';
    let feedWarningMessageEn = '';

    if (recentFeedRecords.length >= 3) {
      const previousRecords = recentFeedRecords.slice(0, -1);

      const previousTotal = previousRecords.reduce(
        (sum, record) =>
          sum + Number(record.actualFeedUsedKg || 0),
        0
      );

      const previousAverage =
        previousRecords.length > 0
          ? previousTotal / previousRecords.length
          : 0;

      const latestFeedKg =
        Number(
          recentFeedRecords[recentFeedRecords.length - 1]
            ?.actualFeedUsedKg || 0
        );

      if (
        previousAverage > 0 &&
        latestFeedKg < previousAverage * 0.25
      ) {
        feedWarning = true;
        feedWarningMessageBn =
          'আজকের খাবারের পরিমাণ আগের দিনের তুলনায় অস্বাভাবিকভাবে কম। রেকর্ডটি যাচাই করুন।';
        feedWarningMessageEn =
          'Today’s feed amount is unusually low compared with recent actual usage. Please verify the record.';
      } else if (
        previousAverage > 0 &&
        latestFeedKg > previousAverage * 3
      ) {
        feedWarning = true;
        feedWarningMessageBn =
          'আজকের খাবারের পরিমাণ আগের দিনের তুলনায় অস্বাভাবিকভাবে বেশি। রেকর্ডটি যাচাই করুন।';
        feedWarningMessageEn =
          'Today’s feed amount is unusually high compared with recent actual usage. Please verify the record.';
      }
    }

    // ------------------------------------------------------------
    // G. STOCK STATUS
    // ------------------------------------------------------------
    let stockStatus:
      | 'critical'
      | 'low'
      | 'healthy'
      | 'no_purchase' = 'healthy';

    if (totalPurchasedBags <= 0) {
      stockStatus = 'no_purchase';
    } else if (remainingKg <= 0) {
      stockStatus = 'critical';
    } else if (
      runwayReady &&
      daysRunway !== null &&
      daysRunway <= 3
    ) {
      stockStatus = 'critical';
    } else if (
      runwayReady &&
      daysRunway !== null &&
      daysRunway <= 7
    ) {
      stockStatus = 'low';
    } else {
      stockStatus = 'healthy';
    }

    // ------------------------------------------------------------
    // H. FEED COST
    // ------------------------------------------------------------
    const avgCostPerKg =
      totalPurchasedKg > 0 && totalCostSpent > 0
        ? totalCostSpent / totalPurchasedKg
        : 0;

    const costOfFeedUsedSoFar =
      Math.round(totalUsedKg * avgCostPerKg);

    const costPerKgLiveGain =
      fcrResult.actualFcr !== null &&
      fcrResult.actualFcr > 0 &&
      avgCostPerKg > 0
        ? Number(
            (fcrResult.actualFcr * avgCostPerKg).toFixed(1)
          )
        : null;

    return {
      bagWeight,

      purchasedBags: totalPurchasedBags,
      totalPurchasedKg,

      totalUsedKg,
      remainingKg,
      remainingBags,

      // REAL measured feed-use information
      recentFeedRecordCount: recentFeedRecords.length,
      averageDailyFeedKg: Number(
        averageDailyFeedKg.toFixed(2)
      ),

      // null means we intentionally refuse to guess
      daysRunway,

      runwayReady,

      stockStatus,

      feedWarning,
      feedWarningMessageBn,
      feedWarningMessageEn,

      totalCostSpent,
      avgCostPerKg: Number(
        avgCostPerKg.toFixed(1)
      ),
      costOfFeedUsedSoFar,
      costPerKgLiveGain
    };
  }, [
    currentBatch,
    fcrResult,
    dailyRecords,
    feedPurchases
  ]);
