import "dotenv/config";

export default async function mailService(req: any) {
  try {
    const response = await fetch(process.env.MAILING_API ?? "", {
      method: "POST",
      body: JSON.stringify(req),
    });
    const textResponse = await response.text();

    return JSON.parse(textResponse);
  } catch (ex: any) {
    console.log("Error mailing", ex.toString());
  }
}
