import { useEffect, useState } from "react";
import API from "@/src/services/api";

const getPayload = (res: any) => res?.data ?? res ?? {};
const safeArray = (value: any) => (Array.isArray(value) ? value : []);
const safeOptions = (value: any) =>
  safeArray(value).filter((item: any) => item && item.id !== undefined && item.id !== null);

export function usePropertyDropdowns(isAuthenticated: boolean, showAlert: any,
   watch: any) {
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);
  const [registrationStatuses, setRegistrationStatuses] = useState<any[]>([]);
  const [dropdowns, setDropdowns] = useState<any>({});
  const selectedBuildingType = parseInt(watch("building_type_id") || "0", 10);
  const selectedBuilding = parseInt(watch("building_id") || "0", 10);

   const selectedStateId = watch("state_id");

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadDropdowns = async () => {
      setLoadingDropdowns(true);

      try {
        const res = await API.getPropertyDropdowns();
        const payload = getPayload(res);

        console.log("Full payload:", JSON.stringify(payload, null, 2));
        const data = payload?.data ?? payload;

        setPropertyTypes(safeOptions(data.propertyTypes));
        setStates(safeOptions(data.states));

        setRegistrationStatuses(
          safeOptions(data.registrationStatuses).filter((item: any) =>
            ["agent", "landlord", "developer"].includes(
              String(item.name).toLowerCase()
            )
          )
        );

        setDropdowns({
          buildingTypes: safeOptions(data.buildingTypes),
          buildings: safeOptions(data.buildings),
          flatTypes: safeOptions(data.flatTypes),
          rentpaymentMethods: safeOptions(data.rentPaymentMethods),
          typeofMeters: safeOptions(data.typeOfMeters),
          overheadTanks: safeOptions(data.overheadTanks),
          wells: safeOptions(data.wells),
          securities: safeOptions(data.securities),
          fences: safeOptions(data.fences),
          pops: safeOptions(data.pops),
          status: safeOptions(data.statuses),
          buildingStatus: safeOptions(data.buildingStatus),
        });
      } catch (error) {
        console.error(error);
        showAlert("Error", "Failed to load dropdown data");
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdowns();
  }, [isAuthenticated]);


   useEffect(() => {
    const loadAreas = async () => {
      if (!selectedStateId) {
        setAreas([]);
        return;
      }

  

      try {
        const res = await API.getPropertyArea(selectedStateId);
        const payload = getPayload(res);
        const areaData = payload?.data ?? payload;
       
        setAreas(safeOptions(Array.isArray(areaData) ? areaData : areaData.areas ?? areaData));
      } catch (error) {
        console.error("Area dropdown error:", error);
        setAreas([]);
        showAlert("Error", "Could not load areas for selected state");
      }
    };

    loadAreas();
  }, [selectedStateId]);

  return {
    loadingDropdowns,
    states,
    areas,
    setAreas,
    propertyTypes,
    registrationStatuses,
    dropdowns,
    selectedBuildingType,
    selectedBuilding,
  };
}