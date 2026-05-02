package com.Ethara.jayanth;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "app.jwt.secret=TestSecretKeyForJWTSigningThatIsLongEnough256Bits",
    "app.jwt.expiration=86400000"
})
class JayanthApplicationTests {

    @Test
    void contextLoads() {
    }
}
