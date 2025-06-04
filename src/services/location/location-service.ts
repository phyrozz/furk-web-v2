import locationData from './philippine_provinces_cities_municipalities_and_barangays_2019v2.json';

export interface Region {
  region_name: string;
  province_list: Record<string, Province>;
}

export interface Province {
  municipality_list: Record<string, Municipality>;
}

export interface Municipality {
  barangay_list: string[];
}

export class LocationService {
  private data: Record<string, Region>;

  constructor() {
    this.data = locationData;
  }

  getProvinces(): string[] {
    const provinces: string[] = [];
    Object.values(this.data).forEach(region => {
      Object.keys(region.province_list).forEach(province => {
        provinces.push(province);
      });
    });
    return provinces.sort();
  }

  getCities(province: string): string[] {
    const cities: string[] = [];
    Object.values(this.data).forEach(region => {
      if (region.province_list[province]) {
        Object.keys(region.province_list[province].municipality_list).forEach(city => {
          cities.push(city);
        });
      }
    });
    return cities.sort();
  }

  getBarangays(province: string, city: string): string[] {
    let barangays: string[] = [];
    Object.values(this.data).forEach(region => {
      if (region.province_list[province]) {
        const municipality = region.province_list[province].municipality_list[city];
        if (municipality) {
          barangays = municipality.barangay_list;
        }
      }
    });
    return barangays.sort();
  }
}