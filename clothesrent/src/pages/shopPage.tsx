import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import ListingsPanel from "../components/ListingsPanel";
import TransactionsPanel from "../components/TransactionsPanel";
import ThriftOutPanel from "../components/ThriftOutPanel";
import "./shopPage.css";

type ShopView = "listings" | "transactions" | "thriftOut" | "personalize";

export default function ShopPage() {
  const { user } = useAuth0();
  const [activeView, setActiveView] = useState<ShopView>("thriftOut");

  const userId = user?.sub ?? "";

  return (
    <main className="shop-page">
      <div className="shop-layout">
        <aside className="shop-sidebar">
          {/* <p className="shop-sidebar-label">Seller Dashboard</p> */}
          <h1 className="font-display shop-sidebar-title">Shop Control</h1>

          <button
            type="button"
            className={`shop-nav-btn${activeView === "thriftOut" ? " active" : ""}`}
            onClick={() => setActiveView("thriftOut")}>
            Thrift Out
          </button>
          <button
            type="button"
            className={`shop-nav-btn${activeView === "thriftOut" ? " active" : ""}`}
            onClick={() => setActiveView("thriftOut")}>
            Thrift Out
          </button>
          <button
            type="button"
            className={`shop-nav-btn${activeView === "listings" ? " active" : ""}`}
            onClick={() => setActiveView("listings")}>
            My Listings
          </button>
          <button
            type="button"
            className={`shop-nav-btn${activeView === "transactions" ? " active" : ""}`}
            onClick={() => setActiveView("transactions")}>
            Transaction Log
          </button>
          {/* 
          <button
            type="button"
            className={`shop-nav-btn${activeView === "personalize" ? " active" : ""}`}
            onClick={() => setActiveView("personalize")}>
            Personalize
          </button> */}
        </aside>

        <section className="shop-content">
          <header className="shop-content-head">
            <h2 className="font-display shop-content-title">
              {activeView === "listings" && "My Listings"}
              {activeView === "transactions" && "Transaction Log"}
              {activeView === "thriftOut" && "Thrift Out"}
              {activeView === "personalize" && "Personalize"}
            </h2>
          </header>

          {activeView === "listings" && <ListingsPanel userId={userId} />}
          {activeView === "transactions" && (
            <TransactionsPanel userId={userId} />
          )}
          {activeView === "thriftOut" && <ThriftOutPanel userId={userId} />}
          {/* {activeView === "personalize" && (
            <PersonalizePanel
              userId={userId}
              fallbackName={user?.name ?? user?.nickname ?? ""}
              fallbackPicture={user?.picture ?? ""}
            />
          )} */}
        </section>
      </div>
    </main>
  );
}
