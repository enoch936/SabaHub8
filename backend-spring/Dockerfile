# syntax=docker/dockerfile:1
FROM eclipse-temurin:21-jre
WORKDIR /app
# Copy the pre-built Spring Boot jar from the build context
# Make sure you've run `./mvnw -DskipTests package` locally so
# the artifact exists at `target/backend-spring-*.jar`.
COPY target/backend-spring-*.jar app.jar
ENV JAVA_OPTS=""
EXPOSE 8080
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
