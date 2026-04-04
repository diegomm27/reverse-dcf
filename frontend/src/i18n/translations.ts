export type Lang = 'en' | 'es';

export const translations = {
  en: {
    header: {
      basedOn: 'Based on',
      bookLink: 'Expectation Investing',
      bookSubtitle: '- Mauboussin & Rappaport',
    },
    search: {
      placeholder: 'Enter a ticker (e.g. AAPL, MSFT, GOOGL)',
      loading: 'Loading...',
      analyze: 'Analyze',
      try: 'Popular:',
    },
    hero: {
      badge: 'Yahoo Finance - live market data',
      title1: 'How many years of operating performance',
      title2: 'is the market discounting today',
      subtitlePrefix: 'Reverse engineer',
      subtitleBold: 'price-implied expectations',
      subtitleSuffix:
        'using shareholder value, forecast FCF, and continuing value to solve for the explicit forecast period embedded in the current price.',
      methodology: 'Methodology:',
      steps: [
        {
          title: 'Enter a ticker',
          desc: 'We pull live Yahoo Finance data, including debt, cash, shares, and operating drivers.',
        },
        {
          title: 'Set the bridge',
          desc: 'Choose the continuing-value method and adjust non-operating assets if the reported balance sheet misses something relevant.',
        },
        {
          title: 'Read the PIE',
          desc: 'The model solves for how many explicit forecast years are required to justify the current stock price.',
        },
      ],
    },
    loading: {
      fetchingData: 'Fetching financial data from Yahoo Finance...',
      tags: ['Quote', 'Financials', 'Cash Flow', 'Balance Sheet'],
    },
    error: {
      title: 'Could not load data',
      hint: 'Try a valid ticker (e.g. AAPL, MSFT, GOOGL, TSLA)',
      retry: 'Try again',
    },
    warnings: {
      financialLikeTitle: 'Special-case business model',
      financialLikeBody:
        'This company is shown, but the reverse FCF setup is less reliable here. For insurers, banks, brokers, asset managers, and investment-heavy holding companies, cash, investments, debt, and float are often core operating inputs rather than simple non-operating bridge items.',
    },
    metrics: {
      marketCap: 'Market Cap',
      enterpriseValue: 'Enterprise Value',
      netDebt: 'Net Debt',
      ttmFCF: 'TTM FCF',
      opMargin: 'Op. Margin',
      beta: 'Beta',
      trailingPE: 'Trailing P/E',
      forwardPE: 'Forward P/E',
      pbRatio: 'P/B Ratio',
      roe: 'ROE',
      analystTarget: 'Analyst target',
    },
    assumptions: {
      title: 'Assumptions',
      operatingDrivers: 'Operating Value Drivers',
      driversDesc:
        "Pre-filled from the company's latest financial statements. These represent the operating performance the market may be extrapolating.",
      reset: 'Reset',
      salesGrowth: 'Sales Growth Rate',
      opMargin: 'Operating Profit Margin',
      cashTaxRate: 'Cash Tax Rate',
      incrWC: 'Incr. Working Capital / Delta Sales',
      incrFC: 'Incr. Fixed Capital / Delta Sales',
      continuingValueMethod: 'Continuing Value Method',
      continuingValueDesc:
        'Use no-growth perpetuity, Gordon growth with inflation, or the Mauboussin-style RONIC = WACC convergence assumption.',
      cvMethods: {
        perpetuity: 'Perpetuity (No Growth)',
        perpetuityWithInflation: 'Perpetuity with Inflation',
        ronicConvergence: 'Continuing Value (RONIC = WACC)',
      },
      terminalGrowth: 'Terminal Growth / Inflation',
      additionalNonOperatingAssets: 'Manual Non-Operating Asset Adjustment',
      reportedNonOperatingAssets: 'Reported cash + LT investments',
      totalNonOperatingAssets: 'Total non-operating assets used',
      wacc: 'WACC',
      waccResult: 'Result:',
      riskFreeRate: 'Risk-Free Rate',
      erp: 'Equity Risk Premium',
      beta: 'Beta',
      costOfDebt: 'Cost of Debt (Pre-Tax)',
      taxRate: 'Marginal Tax Rate',
      debtWeight: 'Debt Weight (D/V)',
      infoText:
        'The PIE is solved from shareholder value: corporate value + non-operating assets - debt. Forecast FCF provides the explicit period, while the continuing value closes the model after that period.',
    },
    fcfAnalysis: {
      pieTitle: 'Price-Implied Expectations (PIE)',
      impliedPeriod: 'Implied Forecast Period',
      impliedPeriodDesc:
        'Years of explicit operating performance required to reconcile the current price',
      na: 'N/A',
      yearsLabel: ' years',
      yearsPlus: '50+ years',
      steadyStateValue: 'Steady-State Value / Share',
      steadyStateValueDesc:
        'Shareholder value per share with zero explicit forecast years under the selected continuing-value method',
      nopatSection: 'Step 1 - Model NOPAT',
      baseRevenue: 'Base Revenue',
      opMarginLabel: 'Operating Profit Margin',
      operatingProfit: '-> Operating Profit',
      cashTaxRateLabel: 'Cash Tax Rate',
      modelNopat: '-> Model NOPAT',
      marketBridgeSection: 'Step 2 - Market-Implied Corporate Value',
      currentShareholderValue: 'Current Shareholder Value',
      debtAdd: '(+) Debt',
      nonOperatingAssetsSubtract: '(-) Non-Operating Assets',
      impliedCorporateValue: '-> Market-Implied Corporate Value',
      pieZeroReason:
        'Steady-state shareholder value already covers the current price, so no explicit forecast period is required.',
      piePositiveReason: (years: number) =>
        `The market requires about ${years.toFixed(1)} explicit forecast years beyond steady state.`,
      pieMaxReason:
        'Even 50 forecast years do not fully bridge the current price under the selected assumptions.',
      nonOperatingSection: 'Step 3 - Non-Operating Asset Bridge',
      reportedCash: 'Reported Cash',
      reportedLongTermInvestments: 'Reported LT Investments',
      manualNonOperatingAssets: 'Manual Adjustment',
      totalNonOperatingAssets: '-> Total Non-Operating Assets',
      solvedValueSection: 'Step 4 - Solved Shareholder Value at PIE',
      pvForecastFCF: 'PV of Forecast FCF',
      pvContinuingValue: 'PV of Continuing Value',
      corporateValue: '-> Corporate Value',
      nonOperatingAssetsAdd: '(+) Non-Operating Assets',
      debtSubtract: '(-) Debt',
      shareholderValue: '-> Shareholder Value',
      sharesOut: 'Shares Outstanding',
      impliedPrice: '-> Implied Price / Share',
      steadyStateSection: 'Step 5 - Steady-State Check (0Y)',
      zeroForecast: 'PV of Forecast FCF',
      steadyStateNote:
        'With zero explicit forecast years, value comes entirely from the continuing-value assumption plus the non-operating asset bridge.',
      continuingValueMethod: 'Continuing value method',
      marketPrice: 'Market Price',
      ttmFCF: 'Reported FCF (TTM)',
      sensitivityTitle: 'Sensitivity - Value / Share vs Forecast Period',
      sensitivityDesc:
        'This curve shows how per-share shareholder value changes as you extend the explicit forecast period before applying the selected continuing-value method.',
      noteLatestAnnual: 'latest annual',
      noteFromDrivers: 'from assumptions',
      noteMarketCap: 'market cap',
      noteTotalDebt: 'total debt',
      chartUnavailable: 'Insufficient data for sensitivity analysis',
      chartForecastLabel: 'Forecast period',
      chartValueLabel: 'Value / share',
      chartLegendValue: 'Shareholder value / share',
      chartLegendMarket: 'Current market price',
      chartLegendPie: 'Price-implied expectations (PIE)',
      chartSummary:
        'The curve shows the per-share value implied by each explicit forecast period under the selected continuing-value method. The intersection with the market-price line is the PIE embedded today.',
    },
    recommendation: {
      verdictTitle: 'Expectation Investing Verdict',
      pieLabel: 'Price-Implied Forecast Period (PIE)',
      pieSub: 'of explicit operating performance is embedded in the current price',
      pieSubLong: '50+ years - the current price is still not justified within the chart range',
      pieNegative: 'Negative NOPAT - cannot compute',
      scaleLabel: 'Implied Period Scale',
      scaleZones: {
        strongBuy: 'Strong Buy',
        buy: 'Buy',
        hold: 'Hold',
        sell: 'Sell',
        strongSell: 'Strong Sell',
      },
      yearShort: 'Y',
      steadyState: 'Steady-State Value',
      steadySub: '0Y explicit forecast',
      priceVsSteadyState: 'Price vs Steady State',
      priceVsSteadySub: (below: boolean) =>
        below ? 'current price is below steady state' : 'current price is above steady state',
      nonOperatingAssets: 'Non-Operating Assets',
      nonOperatingSub: 'cash + investments + manual adj.',
      fcfYield: 'FCF Yield',
      currentPrice: 'Current Price',
      marketShareholderValue: 'Market shareholder value',
      negativeNopatWarning: 'Negative NOPAT - reverse DCF not applicable',
      methodologyBold: 'Expectation Investing',
      methodologyText:
        'Read the expectations embedded in the current price by solving for the explicit forecast period that makes shareholder value equal to market value under your chosen continuing-value assumption.',
      descriptions: {
        'STRONG BUY':
          'The market is not requiring much duration at all. If the operating base is durable, expectations look low.',
        BUY:
          'The market is requiring only a modest explicit forecast period. Expectations do not look demanding.',
        HOLD:
          'The implied forecast period is reasonable. The market is discounting a fair amount of future performance.',
        SELL:
          'The market needs many years of sustained execution. Expectations are elevated.',
        'STRONG SELL':
          'The market needs decades of explicit performance or more. Expectations look extreme.',
        'N/A':
          'Reverse FCF analysis requires positive NOPAT. This company currently has negative operating profit after tax.',
      } as Record<string, string>,
    },
    navigation: {
      overview: 'Overview',
      assumptions: 'Assumptions',
      verdict: 'Verdict',
      analysis: 'Analysis',
      about: 'About',
    },
    about: 'About',
    disclaimer:
      'This tool is for educational purposes only and does not constitute investment advice. Financial data is sourced from Yahoo Finance. Always do your own work.',
  },

  es: {
    header: {
      basedOn: 'Basado en',
      bookLink: 'Expectation Investing',
      bookSubtitle: '- Mauboussin & Rappaport',
    },
    search: {
      placeholder: 'Ingresa un ticker (p. ej., AAPL, MSFT, GOOGL)',
      loading: 'Cargando...',
      analyze: 'Analizar',
      try: 'Populares:',
    },
    hero: {
      badge: 'Yahoo Finance - datos en tiempo real',
      title1: '¿Cuántos años de desempeño operativo',
      title2: 'está descontando hoy el mercado',
      subtitlePrefix: 'Descifra las',
      subtitleBold: 'expectativas implícitas en el precio',
      subtitleSuffix:
        'a partir del valor para el accionista, el FCF proyectado y el valor continuo para resolver el período explícito que exige el precio actual.',
      methodology: 'Metodología:',
      steps: [
        {
          title: 'Ingresa el ticker',
          desc: 'Traemos datos financieros en vivo de Yahoo Finance, incluyendo deuda, caja, acciones y drivers operativos.',
        },
        {
          title: 'Define el puente',
          desc: 'Elige el método de valor continuo y ajusta los activos no operativos si el balance reportado no captura toda la realidad económica.',
        },
        {
          title: 'Lee el PIE',
          desc: 'El modelo resuelve cuántos años de pronóstico explícito exige el precio actual.',
        },
      ],
    },
    loading: {
      fetchingData: 'Obteniendo datos financieros desde Yahoo Finance...',
      tags: ['Cotización', 'Estados financieros', 'Flujos de caja', 'Balance'],
    },
    error: {
      title: 'No se pudieron cargar los datos',
      hint: 'Prueba con un ticker valido (p. ej., AAPL, MSFT, GOOGL, TSLA)',
      retry: 'Intentar de nuevo',
    },
    warnings: {
      financialLikeTitle: 'Modelo de negocio especial',
      financialLikeBody:
        'La compania se muestra, pero el esquema de reverse FCF es menos confiable aqui. En aseguradoras, bancos, brokers, gestoras y holdings con grandes carteras de inversion, la caja, las inversiones, la deuda y el float suelen ser insumos operativos centrales y no simples activos no operativos del puente.',
    },
    metrics: {
      marketCap: 'Capitalización',
      enterpriseValue: 'Valor empresa',
      netDebt: 'Deuda neta',
      ttmFCF: 'FCF (12m)',
      opMargin: 'Margen operativo',
      beta: 'Beta',
      trailingPE: 'P/U histórico',
      forwardPE: 'P/U estimado',
      pbRatio: 'Precio / libro',
      roe: 'ROE',
      analystTarget: 'Objetivo analistas',
    },
    assumptions: {
      title: 'Supuestos',
      operatingDrivers: 'Drivers operativos de valor',
      driversDesc:
        'Precargados desde los últimos estados financieros. Representan el desempeño operativo que el mercado podría extrapolar.',
      reset: 'Restablecer',
      salesGrowth: 'Crecimiento de ventas',
      opMargin: 'Margen de beneficio operativo',
      cashTaxRate: 'Tasa efectiva de impuestos',
      incrWC: 'Capital de trabajo incr. / delta ventas',
      incrFC: 'Capital fijo incr. / delta ventas',
      continuingValueMethod: 'Método de valor continuo',
      continuingValueDesc:
        'Puedes usar perpetuidad sin crecimiento, Gordon con inflación o la convergencia estilo Mauboussin con RONIC = WACC.',
      cvMethods: {
        perpetuity: 'Perpetuidad (sin crecimiento)',
        perpetuityWithInflation: 'Perpetuidad con inflación',
        ronicConvergence: 'Valor continuo (RONIC = WACC)',
      },
      terminalGrowth: 'Crecimiento terminal / inflación',
      additionalNonOperatingAssets: 'Ajuste manual de activos no operativos',
      reportedNonOperatingAssets: 'Caja reportada + inversiones LP',
      totalNonOperatingAssets: 'Activos no operativos utilizados',
      wacc: 'WACC',
      waccResult: 'Resultado:',
      riskFreeRate: 'Tasa libre de riesgo',
      erp: 'Prima de riesgo de mercado',
      beta: 'Beta',
      costOfDebt: 'Costo de deuda (antes de impuestos)',
      taxRate: 'Tasa impositiva marginal',
      debtWeight: 'Peso de la deuda (D/V)',
      infoText:
        'El PIE se resuelve a partir del valor para el accionista: valor corporativo + activos no operativos - deuda. El FCF proyectado cubre el período explícito y el valor continuo cierra el modelo después de ese período.',
    },
    fcfAnalysis: {
      pieTitle: 'Expectativas implícitas en el precio (PIE)',
      impliedPeriod: 'Período explícito implícito',
      impliedPeriodDesc:
        'Años de desempeño operativo explícito necesarios para reconciliar el precio actual',
      na: 'N/A',
      yearsLabel: ' años',
      yearsPlus: '50+ años',
      steadyStateValue: 'Valor en estado estable / acción',
      steadyStateValueDesc:
        'Valor por acción con cero años de pronóstico explícito bajo el método de valor continuo seleccionado',
      nopatSection: 'Paso 1 - Modelar el NOPAT',
      baseRevenue: 'Ingresos base',
      opMarginLabel: 'Margen de beneficio operativo',
      operatingProfit: '-> Beneficio operativo',
      cashTaxRateLabel: 'Tasa efectiva de impuestos',
      modelNopat: '-> NOPAT del modelo',
      marketBridgeSection: 'Paso 2 - Valor corporativo implícito por el mercado',
      currentShareholderValue: 'Valor actual para el accionista',
      debtAdd: '(+) Deuda',
      nonOperatingAssetsSubtract: '(-) Activos no operativos',
      impliedCorporateValue: '-> Valor corporativo implícito',
      pieZeroReason:
        'El valor para el accionista en estado estable ya cubre el precio actual, así que no hace falta un período explícito.',
      piePositiveReason: (years: number) =>
        `El mercado exige aproximadamente ${years.toFixed(1)} años de pronóstico explícito por encima del estado estable.`,
      pieMaxReason:
        'Ni siquiera 50 años de pronóstico cierran por completo el precio actual con estos supuestos.',
      nonOperatingSection: 'Paso 3 - Puente de activos no operativos',
      reportedCash: 'Caja reportada',
      reportedLongTermInvestments: 'Inversiones LP reportadas',
      manualNonOperatingAssets: 'Ajuste manual',
      totalNonOperatingAssets: '-> Activos no operativos totales',
      solvedValueSection: 'Paso 4 - Valor para el accionista resuelto en el PIE',
      pvForecastFCF: 'PV del FCF explícito',
      pvContinuingValue: 'PV del valor continuo',
      corporateValue: '-> Valor corporativo',
      nonOperatingAssetsAdd: '(+) Activos no operativos',
      debtSubtract: '(-) Deuda',
      shareholderValue: '-> Valor para el accionista',
      sharesOut: 'Acciones en circulación',
      impliedPrice: '-> Precio implícito / acción',
      steadyStateSection: 'Paso 5 - Revisión de estado estable (0A)',
      zeroForecast: 'PV del FCF explícito',
      steadyStateNote:
        'Con cero años de pronóstico explícito, todo el valor proviene del valor continuo más el puente de activos no operativos.',
      continuingValueMethod: 'Método de valor continuo',
      marketPrice: 'Precio de mercado',
      ttmFCF: 'FCF reportado (12m)',
      sensitivityTitle: 'Sensibilidad - Valor / acción vs. período explícito',
      sensitivityDesc:
        'La curva muestra cómo cambia el valor por acción al extender el período explícito antes de aplicar el método de valor continuo seleccionado.',
      noteLatestAnnual: 'último año reportado',
      noteFromDrivers: 'desde supuestos',
      noteMarketCap: 'capitalización',
      noteTotalDebt: 'deuda total',
      chartUnavailable: 'Datos insuficientes para el análisis de sensibilidad',
      chartForecastLabel: 'Período explícito',
      chartValueLabel: 'Valor / acción',
      chartLegendValue: 'Valor para el accionista / acción',
      chartLegendMarket: 'Precio de mercado actual',
      chartLegendPie: 'Expectativas implícitas en el precio (PIE)',
      chartSummary:
        'La curva muestra el valor por acción que resulta de cada período explícito bajo el método de valor continuo elegido. El cruce con la línea de precio de mercado es el PIE que el mercado está descontando hoy.',
    },
    recommendation: {
      verdictTitle: 'Veredicto Expectation Investing',
      pieLabel: 'Período implícito de pronóstico (PIE)',
      pieSub: 'de desempeño operativo explícito está embebido en el precio actual',
      pieSubLong: '50+ años - el precio actual sigue sin justificarse dentro del rango del gráfico',
      pieNegative: 'NOPAT negativo - no se puede calcular',
      scaleLabel: 'Escala del período implícito',
      scaleZones: {
        strongBuy: 'Compra fuerte',
        buy: 'Compra',
        hold: 'Mantener',
        sell: 'Venta',
        strongSell: 'Venta fuerte',
      },
      yearShort: 'A',
      steadyState: 'Valor en estado estable',
      steadySub: '0 años de pronóstico explícito',
      priceVsSteadyState: 'Precio vs. estado estable',
      priceVsSteadySub: (below: boolean) =>
        below ? 'el precio actual está por debajo del estado estable' : 'el precio actual está por encima del estado estable',
      nonOperatingAssets: 'Activos no operativos',
      nonOperatingSub: 'caja + inversiones + ajuste manual',
      fcfYield: 'Rendimiento FCF',
      currentPrice: 'Precio actual',
      marketShareholderValue: 'Valor de mercado para el accionista',
      negativeNopatWarning: 'NOPAT negativo - DCF inverso no aplicable',
      methodologyBold: 'Expectation Investing',
      methodologyText:
        'Lee las expectativas implícitas en el precio resolviendo el período de pronóstico explícito que iguala el valor para el accionista con el valor de mercado bajo tu supuesto de valor continuo.',
      descriptions: {
        'STRONG BUY':
          'El mercado no está exigiendo casi duración. Si la base operativa es resistente, las expectativas parecen bajas.',
        BUY:
          'El mercado exige un período explícito modesto. Las expectativas no parecen exigentes.',
        HOLD:
          'El período implícito es razonable. El mercado descuenta una cantidad justa de desempeño futuro.',
        SELL:
          'El mercado necesita muchos años de ejecución sostenida. Las expectativas son elevadas.',
        'STRONG SELL':
          'El mercado necesita décadas de desempeño explícito o más. Las expectativas parecen extremas.',
        'N/A':
          'El análisis de FCF inverso requiere NOPAT positivo. Esta empresa tiene actualmente beneficio operativo después de impuestos negativo.',
      } as Record<string, string>,
    },
    navigation: {
      overview: 'Resumen',
      assumptions: 'Supuestos',
      verdict: 'Veredicto',
      analysis: 'Análisis',
      about: 'Empresa',
    },
    about: 'Acerca de',
    disclaimer:
      'Esta herramienta es solo educativa y no constituye asesoramiento de inversión. Los datos financieros provienen de Yahoo Finance. Haz siempre tu propio trabajo.',
  },
} as const;

export type Translations = (typeof translations)['en'];
