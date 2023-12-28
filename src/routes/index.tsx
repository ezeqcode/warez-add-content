import React, { Suspense } from "react";
import {  Route, Routes } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";

const LazyAddContent = React.lazy(() => import("../pages/AddContent"));

const Index: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <LazyAddContent />
          </Suspense>
        }
      />
    </Routes>
  );
};

export default Index;
