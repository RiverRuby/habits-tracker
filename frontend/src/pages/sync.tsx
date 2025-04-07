import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { syncCode } from "../utils/utils";

export default function Sync() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id");

  React.useEffect(() => {
    if (!id) return;

    syncCode(id);
    navigate("/");
  }, [id]);

  return <div>Syncing...</div>;
}
