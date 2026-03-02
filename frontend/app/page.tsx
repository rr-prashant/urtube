// import Image from "next/image";
import { fetchItem } from "@/lib/fetch";

interface Item {
  id: number;
  name: string;
}

export default async function Home() {
  let Item: Item[] = [];

  try{
    Item = await fetchItem();
  }catch(error){
    console.error("Error fetching items:", error);
  }

  return (
    <div>
      <main>
        <h1>Home Page</h1>
        <div>
        {Item.map((item) => (
          <h2 key={item.id}>{item.name}</h2>
        ))}
        </div>
      </main>
    </div>
  );
}
