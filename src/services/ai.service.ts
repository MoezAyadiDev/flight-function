import { IFlightAirline } from "../repositories/airline.repo";
import { durationToChaine } from "../utils/date.util";

export async function fetchFlightInfoAi(airlineFlightNum: IFlightAirline) {
  try {
    const response = await fetch(
      `https://airportinfo.live/fr/vol/${
        airlineFlightNum.icao ?? airlineFlightNum.localName
      }`
    );
    const flatText = await response.text();

    const index = flatText.indexOf("<!--End Matomo Code -->");
    const indexclose = flatText.indexOf("</script>", index);
    const indexOpen = flatText.indexOf("{", index);

    const myJson = JSON.parse(flatText.substring(indexOpen, indexclose - 1));
    const myFlight: AiFlight = myJson;
    const depTime = myFlight.departureTime.substring(11, 16);
    const arrTime = myFlight.arrivalTime.substring(11, 16);

    const duration =
      Number(arrTime.split(":")[0]) * 60 * 60 +
      Number(arrTime.split(":")[1]) * 60 -
      Number(depTime.split(":")[0]) * 60 * 60 -
      Number(depTime.split(":")[1]) * 60;
    const flt = durationToChaine(duration);
    return {
      flight_num: airlineFlightNum.iata ?? "",
      flight_icao: airlineFlightNum.icao ?? "",
      flight_time: flt,
      from_code_airport: myFlight.departureAirport.iataCode,
      from_airport: myFlight.departureAirport.name,
      to_code_airport: myFlight.arrivalAirport.iataCode,
      to_airport: myFlight.arrivalAirport.name,
      departure_time: depTime,
      arrival_time: arrTime,
      airline: airlineFlightNum.airline ?? "",
      local_name: airlineFlightNum.localName,
      duration: duration,
    };
  } catch (ex) {
    console.error(`ERROR: ${ex}`);
    return undefined;
  }
}

interface AiFlight {
  provider: {
    name: string; //Airline name
  };
  departureAirport: {
    name: string; //Airport name
    iataCode: string; //Airport Code
  };
  departureTime: string; //"2025-03-29T16:15:00.000"
  arrivalAirport: {
    name: string; //Airport name
    iataCode: string; //Airport Code
  };
  arrivalTime: string; //"2025-03-29T20:10:00.000";
}

// {
//   '@context': 'http://schema.org',
//   '@type': 'Flight',
//   flightNumber: 'U26331',
//   departureTerminal: 'S',
//   departureGate: '5',
//   arrivalTerminal: '',
//   estimatedFlightDuration: 'PT2H55M',
//   flightDistance: '1875 km',
//   provider: {
//     '@type': 'Airline',
//     name: 'easyJet',
//     iataCode: 'U2',
//     boardingPolicy: 'http://schema.org/ZoneBoardingPolicy'
//   },
//   seller: { '@type': 'Airline', name: 'easyJet', iataCode: 'U2' },
//   departureAirport: { '@type': 'Airport', name: 'Londres-Gatwick', iataCode: 'LGW' },
//   departureTime: '2025-03-29T16:15:00.000',
//   arrivalAirport: {
//     '@type': 'Airport',
//     name: 'Enfidha-Hammamet International',
//     iataCode: 'NBE'
//   },
//   arrivalTime: '2025-03-29T20:10:00.000'
// }
