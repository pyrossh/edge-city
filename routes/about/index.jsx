import { page, useRouter } from "@/utils";

export default page(() => {
  const router = useRouter();
  return (
    <div>
      <p>
        Hello from server
      </p>
    </div>
  );
});