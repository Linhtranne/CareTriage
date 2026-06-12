import java.nio.file.Files;
import java.nio.file.Paths;

public class CheckString {
    public static void main(String[] args) throws Exception {
        String content = new String(Files.readAllBytes(Paths.get("D:/CareTriage/code/backend/backend/src/main/java/com/caretriage/shared/exception/GlobalExceptionHandler.java")), "UTF-8");
        int idx = content.indexOf("nghi");
        System.out.println(content.substring(idx - 10, idx + 20));
    }
}
