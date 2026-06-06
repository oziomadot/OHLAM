import { useEffect, useState } from "react";
import API from "@/src/services/api";

export function usePropertyDropdowns(isAuthenticated: boolean, showAlert: any, watch: any) {
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);
  const [registrationStatuses, setRegistrationStatuses] = useState<any[]>([]);
  const [dropdowns, setDropdowns] = useState<any>({});
  const selectedBuildingType = parseInt(watch("building_type_id") || "0", 10);
  const selectedBuilding = parseInt(watch("building_id") || "0", 10);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadDropdowns = async () => {
      setLoadingDropdowns(true);

      try {
        const res = await API.getProperty();
        const data = res.data;

        setPropertyTypes(data.propertyTypes || []);
        setStates(data.states || []);

        setRegistrationStatuses(
          (data.registrationStatuses || []).filter((item: any) =>
            ["agent", "landlord", "developer"].includes(
              String(item.name).toLowerCase()
            )
          )
        );

        setDropdowns({
          buildingTypes: data.buildingTypes || [],
          buildings: data.buildings || [],
          flatTypes: data.flatTypes || [],
          rentpaymentMethods: data.rentPaymentMethods || [],
          typeofMeters: data.typeOfMeters || [],
          overheadTanks: data.overheadTanks || [],
          wells: data.wells || [],
          securities: data.securities || [],
          fences: data.fences || [],
          pops: data.pops || [],
          status: data.statuses || [],
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